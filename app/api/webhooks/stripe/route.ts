import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { subscriptions, paymentEvents, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import Stripe from 'stripe'
import { sendSubscriptionWelcomeEmail, sendPaymentReceiptEmail, sendSubscriptionCancelledEmail, sendPaymentFailedEmail } from '@/lib/email-sender'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.text()
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json({ error: 'No signature' }, { status: 400 })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error('Webhook signature verification failed:', err)
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  // Check idempotency
  const existingEvent = await db.query.paymentEvents.findFirst({
    where: eq(paymentEvents.processorEventId, event.id),
  })

  if (existingEvent) {
    return NextResponse.json({ received: true })
  }

  try {
    await db.transaction(async (tx) => {
      switch (event.type) {
        case 'customer.subscription.created':
        case 'customer.subscription.updated': {
          const subscription = event.data.object as Stripe.Subscription
          
          // ✅ Get email from subscription metadata (set during checkout)
          const customerEmail = subscription.metadata.email

          if (!customerEmail) {
            console.warn('⚠️ No email in subscription metadata')
            break
          }

          // ✅ Look up user by email (same as Paystack)
          const user = await tx.query.users.findFirst({
            where: eq(users.email, customerEmail),
          })

          if (!user) {
            console.warn('⚠️ User not found for email:', customerEmail)
            break
          }

          console.log('✅ User found by email:', {
            id: user.id,
            email: user.email,
            name: user.name
          })

          const isNewSubscription = event.type === 'customer.subscription.created'
          const trialEndsAt = subscription.trial_end
            ? new Date(subscription.trial_end * 1000)
            : null

          // Check if user already has a subscription (trial or otherwise)
          const existingSubscription = await tx.query.subscriptions.findFirst({
            where: and(
              eq(subscriptions.userId, user.id),
              eq(subscriptions.paymentProcessor, 'stripe')
            ),
          })

          if (existingSubscription && !existingSubscription.stripeSubscriptionId) {
            // Update existing trial subscription with Stripe details
            await tx
              .update(subscriptions)
              .set({
                status: subscription.status,
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                trialEndsAt,
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, existingSubscription.id))

            console.log('✅ Updated existing subscription with Stripe details:', {
              subscriptionId: existingSubscription.id,
              stripeSubscriptionId: subscription.id,
              status: subscription.status
            })
          } else {
            // Create new subscription or update existing one
            await tx
              .insert(subscriptions)
              .values({
                userId: user.id,
                plan: subscription.metadata.plan || 'diaspora_monthly',
                status: subscription.status,
                trialEndsAt,
                currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                stripeSubscriptionId: subscription.id,
                stripeCustomerId: subscription.customer as string,
                paymentProcessor: 'stripe',
              })
              .onConflictDoUpdate({
                target: subscriptions.stripeSubscriptionId,
                set: {
                  status: subscription.status,
                  currentPeriodStart: new Date((subscription as any).current_period_start * 1000),
                  currentPeriodEnd: new Date((subscription as any).current_period_end * 1000),
                  trialEndsAt,
                  updatedAt: new Date(),
                },
              })

            console.log('✅ Subscription created/updated:', {
              userId: user.id,
              stripeSubscriptionId: subscription.id,
              status: subscription.status,
              isNew: isNewSubscription
            })
          }

          // Send welcome email for new subscriptions
          if (isNewSubscription) {
            await sendSubscriptionWelcomeEmail({
              email: customerEmail,
              name: user.name || undefined,
              plan: subscription.metadata.plan || 'diaspora_monthly',
              trialEndsAt: trialEndsAt || undefined,
            })
          }

          break
        }

        case 'customer.subscription.deleted': {
          const subscription = event.data.object as Stripe.Subscription
          
          // ✅ Get email from subscription metadata
          const customerEmail = subscription.metadata.email

          await tx
            .update(subscriptions)
            .set({
              status: 'cancelled',
              cancelledAt: new Date(),
              updatedAt: new Date(),
            })
            .where(eq(subscriptions.stripeSubscriptionId, subscription.id))

          console.log('✅ Subscription cancelled:', subscription.id)

          // Send cancellation email
          if (customerEmail) {
            // ✅ Look up user by email
            const user = await tx.query.users.findFirst({
              where: eq(users.email, customerEmail),
            })

            if (user) {
              console.log('✅ Sending cancellation email to:', customerEmail)
              
              await sendSubscriptionCancelledEmail({
                email: customerEmail,
                name: user.name || undefined,
                plan: subscription.metadata.plan || 'diaspora_monthly',
                accessEndsAt: new Date((subscription as any).current_period_end * 1000),
              })
            }
          }

          break
        }

        case 'invoice.payment_succeeded': {
          const invoice = event.data.object as Stripe.Invoice
          
          // ✅ Get email from invoice
          const customerEmail = (invoice as any).customer_email
          
          if ((invoice as any).subscription && customerEmail) {
            // ✅ Look up user by email
            const user = await tx.query.users.findFirst({
              where: eq(users.email, customerEmail),
            })

            if (!user) {
              console.warn('⚠️ User not found for email:', customerEmail)
              break
            }

            const subscription = await tx.query.subscriptions.findFirst({
              where: eq(subscriptions.stripeSubscriptionId, (invoice as any).subscription as string),
            })

            if (user && subscription && (invoice as any).amount_paid > 0) {
              console.log('✅ Sending payment receipt to:', customerEmail)
              
              await sendPaymentReceiptEmail({
                email: customerEmail,
                name: user.name || undefined,
                plan: subscription.plan,
                amount: (invoice as any).amount_paid / 100, // Convert from cents
                currency: (invoice as any).currency,
                nextBillingDate: new Date(subscription.currentPeriodEnd),
                invoiceUrl: (invoice as any).hosted_invoice_url || undefined,
              })
            }
          }

          break
        }

        case 'invoice.payment_failed': {
          const invoice = event.data.object as Stripe.Invoice
          
          // ✅ Get email from invoice
          const customerEmail = (invoice as any).customer_email
          
          if ((invoice as any).subscription && customerEmail) {
            // ✅ Look up user by email
            const user = await tx.query.users.findFirst({
              where: eq(users.email, customerEmail),
            })

            if (!user) {
              console.warn('⚠️ User not found for email:', customerEmail)
              break
            }

            const subscription = await tx.query.subscriptions.findFirst({
              where: eq(subscriptions.stripeSubscriptionId, (invoice as any).subscription as string),
            })

            if (user && subscription) {
              console.log('✅ Sending payment failed email to:', customerEmail)
              
              // Calculate next retry date (Stripe typically retries after 3 days)
              const nextAttemptDate = new Date()
              nextAttemptDate.setDate(nextAttemptDate.getDate() + 3)

              await sendPaymentFailedEmail({
                email: customerEmail,
                name: user.name || undefined,
                plan: subscription.plan,
                amount: (invoice as any).amount_due / 100, // Convert from cents
                currency: (invoice as any).currency,
                nextAttemptDate,
              })
            }
          }

          break
        }
      }

      await tx.insert(paymentEvents).values({
        processor: 'stripe',
        eventType: event.type,
        processorEventId: event.id,
        metadata: event as any,
      })
    })

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'Processing failed' }, { status: 500 })
  }
}
