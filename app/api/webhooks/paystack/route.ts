import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subscriptions, paymentEvents, users } from '@/lib/db/schema'
import { eq, and, desc, sql } from 'drizzle-orm'
import { sendSubscriptionWelcomeEmail, sendPaymentReceiptEmail, sendSubscriptionCancelledEmail } from '@/lib/email-sender'
import { 
  createPaymentIdempotencyKey,
  isValidPlan,
  getUserTrialInfo
} from '@/lib/subscription-utils'
import { webhookRateLimiter, getClientIdentifier } from '@/lib/rate-limiter'
import { 
  verifyPaystackSignature, 
  safeJsonParse, 
  sanitizeWebhookPayload,
  createWebhookErrorResponse 
} from '@/lib/webhook-security'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

// Webhook timeout in milliseconds (30 seconds)
const WEBHOOK_TIMEOUT = 30000

export async function POST(req: NextRequest) {
  const startTime = Date.now()
  
  try {
    // Rate limiting
    const clientId = getClientIdentifier(req)
    const rateLimitResult = webhookRateLimiter.isAllowed(clientId)
    
    if (!rateLimitResult.allowed) {
      console.warn(`🚫 Rate limit exceeded for client: ${clientId}`)
      return NextResponse.json(
        createWebhookErrorResponse('Rate limit exceeded', 429).response,
        { 
          status: 429,
          headers: {
            'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
            'X-RateLimit-Reset': new Date(rateLimitResult.resetTime).toISOString(),
            'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
          }
        }
      )
    }

    // Get request body and signature
    const body = await req.text()
    const signature = req.headers.get('x-paystack-signature')

    // Verify webhook signature
    const signatureValidation = verifyPaystackSignature(body, signature)
    if (!signatureValidation.isValid) {
      console.error(`❌ Webhook signature validation failed: ${signatureValidation.error}`)
      const { response, statusCode } = createWebhookErrorResponse(
        signatureValidation.error || 'Signature validation failed',
        signatureValidation.errorCode === 'MISSING_SIGNATURE' ? 400 : 401,
        { errorCode: signatureValidation.errorCode }
      )
      return NextResponse.json(response, { status: statusCode })
    }

    // Parse JSON safely
    const jsonParseResult = safeJsonParse(body)
    if (!jsonParseResult.success) {
      console.error(`❌ Invalid JSON in webhook body: ${jsonParseResult.error}`)
      const { response, statusCode } = createWebhookErrorResponse(
        jsonParseResult.error || 'Invalid JSON',
        400,
        { errorCode: 'INVALID_JSON' }
      )
      return NextResponse.json(response, { status: statusCode })
    }

    const event = jsonParseResult.data

    // Log sanitized webhook event
    console.log('📨 Webhook received:', {
      event: event.event,
      timestamp: new Date().toISOString(),
      data: sanitizeWebhookPayload(event.data)
    })

    // Create idempotency key to prevent duplicate processing
    const idempotencyKey = createPaymentIdempotencyKey(event)
    
    // Check idempotency
    const existingEvent = await db.query.paymentEvents.findFirst({
      where: eq(paymentEvents.processorEventId, idempotencyKey),
    })

    if (existingEvent) {
      console.log('✅ Event already processed:', idempotencyKey)
      return NextResponse.json({ received: true, message: 'Event already processed' })
    }

    // Process webhook with timeout
    const processingPromise = processWebhookEvent(event, idempotencyKey)
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Webhook processing timeout')), WEBHOOK_TIMEOUT)
    })

    await Promise.race([processingPromise, timeoutPromise])

    const processingTime = Date.now() - startTime
    console.log(`✅ Webhook processed successfully in ${processingTime}ms`)
    
    return NextResponse.json({ 
      received: true, 
      processed: true,
      processingTime: `${processingTime}ms`
    })

  } catch (error) {
    const processingTime = Date.now() - startTime
    console.error(`❌ Webhook processing failed after ${processingTime}ms:`, error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const { response, statusCode } = createWebhookErrorResponse(
      'Webhook processing failed',
      500,
      { 
        error: errorMessage,
        processingTime: `${processingTime}ms`
      }
    )
    
    return NextResponse.json(response, { status: statusCode })
  }
}

async function processWebhookEvent(event: any, idempotencyKey: string) {
  try {
    await db.transaction(async (tx) => {
      // Log the payment event first
      await tx.insert(paymentEvents).values({
        processor: 'paystack',
        eventType: event.event,
        processorEventId: idempotencyKey,
        metadata: event,
      })

      switch (event.event) {
        case 'subscription.create': {
          const subscription = event.data
          const customerEmail = subscription.customer.email

          // Validate plan
          if (!isValidPlan(subscription.plan.name)) {
            console.warn('⚠️ Invalid plan name:', subscription.plan.name)
            break
          }

          const user = await tx.query.users.findFirst({
            where: eq(users.email, customerEmail),
          })

          if (!user) {
            console.warn('⚠️ User not found for subscription creation:', customerEmail)
            break
          }

          // Check if user already has a subscription to determine trial eligibility
          const trialInfo = await getUserTrialInfo(user.id)

          // Prevent duplicate subscriptions for the same Paystack subscription code
          const duplicateSubscription = await tx.query.subscriptions.findFirst({
            where: eq(subscriptions.paystackSubscriptionCode, subscription.subscription_code),
          })

          if (duplicateSubscription) {
            console.warn('⚠️ Subscription already exists for code:', subscription.subscription_code)
            break
          }

          const hasHadTrial = trialInfo.hasHadTrial
          const trialEndsAt = trialInfo.trialEndsAt
          const status = trialInfo.status

          await tx.insert(subscriptions).values({
            userId: user.id,
            plan: subscription.plan.name,
            status,
            trialEndsAt,
            currentPeriodStart: new Date(),
            currentPeriodEnd: new Date(subscription.next_payment_date),
            paystackSubscriptionCode: subscription.subscription_code,
            paystackCustomerCode: subscription.customer.customer_code,
            paymentProcessor: 'paystack',
          })

          console.log('✅ Subscription created:', {
            userId: user.id,
            plan: subscription.plan.name,
            status,
            hasTrialPeriod: !!trialEndsAt,
            trialEndsAt
          })

          // Send welcome email
          await sendSubscriptionWelcomeEmail({
            email: customerEmail,
            name: user.name || undefined,
            plan: subscription.plan.name,
            trialEndsAt: trialEndsAt || undefined,
          })

          break
        }

        case 'charge.success': {
          const charge = event.data
          
          if (charge.plan && charge.customer.email) {
            const user = await tx.query.users.findFirst({
              where: eq(users.email, charge.customer.email),
            })

            if (!user) {
              console.warn('⚠️ User not found for payment:', charge.customer.email)
              break
            }

            // Find subscription by multiple criteria (more robust)
            let subscription = null
            
            // Try 1: Find by customer code
            if (charge.customer.customer_code) {
              subscription = await tx.query.subscriptions.findFirst({
                where: eq(subscriptions.paystackCustomerCode, charge.customer.customer_code),
              })
            }
            
            // Try 2: Find by user ID and payment processor (most recent non-active)
            if (!subscription) {
              subscription = await tx.query.subscriptions.findFirst({
                where: and(
                  eq(subscriptions.userId, user.id),
                  eq(subscriptions.paymentProcessor, 'paystack'),
                  // Only consider subscriptions that aren't already active
                  sql`${subscriptions.status} IN ('trialing', 'pending')`
                ),
                orderBy: [desc(subscriptions.createdAt)],
              })
            }
            
            // Try 3: If still not found, get the most recent Paystack subscription
            if (!subscription) {
              subscription = await tx.query.subscriptions.findFirst({
                where: and(
                  eq(subscriptions.userId, user.id),
                  eq(subscriptions.paymentProcessor, 'paystack')
                ),
                orderBy: [desc(subscriptions.createdAt)],
              })
            }

            if (subscription) {
              // Calculate next billing date from charge data or plan
              let nextBillingDate = subscription.currentPeriodEnd
              if (charge.plan?.next_payment_date) {
                nextBillingDate = new Date(charge.plan.next_payment_date)
              }

              // Update subscription to active and add customer code
              await tx
                .update(subscriptions)
                .set({
                  status: 'active',
                  paystackCustomerCode: charge.customer.customer_code || subscription.paystackCustomerCode,
                  currentPeriodEnd: nextBillingDate,
                  paymentReference: charge.reference,
                  updatedAt: new Date(),
                })
                .where(eq(subscriptions.id, subscription.id))

              console.log('✅ Subscription activated after payment:', {
                subscriptionId: subscription.id,
                userId: user.id,
                previousStatus: subscription.status,
                newStatus: 'active',
                customerEmail: charge.customer.email,
                customerCode: charge.customer.customer_code,
                reference: charge.reference
              })

              // Send payment receipt
              await sendPaymentReceiptEmail({
                email: charge.customer.email,
                name: user.name || undefined,
                plan: subscription.plan,
                amount: charge.amount / 100, // Convert from kobo
                currency: charge.currency,
                nextBillingDate: nextBillingDate,
              })
            } else {
              console.error('❌ No subscription found for payment:', {
                email: charge.customer.email,
                userId: user.id,
                customerCode: charge.customer.customer_code,
                reference: charge.reference
              })
            }
          }

          break
        }

        case 'subscription.disable': {
          const subscription = event.data
          const customerEmail = subscription.customer.email

          // Find and update subscription
          const existingSubscription = await tx.query.subscriptions.findFirst({
            where: eq(subscriptions.paystackSubscriptionCode, subscription.subscription_code),
          })

          if (existingSubscription) {
            await tx
              .update(subscriptions)
              .set({
                status: 'cancelled',
                cancelledAt: new Date(),
                updatedAt: new Date(),
              })
              .where(eq(subscriptions.id, existingSubscription.id))

            console.log('✅ Subscription cancelled:', existingSubscription.id)

            // Send cancellation email
            if (customerEmail) {
              const user = await tx.query.users.findFirst({
                where: eq(users.email, customerEmail),
              })

              if (user) {
                await sendSubscriptionCancelledEmail({
                  email: customerEmail,
                  name: user.name || undefined,
                  plan: subscription.plan.name,
                  accessEndsAt: new Date(), // Paystack cancels immediately
                })
              }
            }
          }

          break
        }

        default:
          console.log(`ℹ️ Unhandled webhook event: ${event.event}`)
          break
      }
    })
  } catch (error) {
    console.error('❌ Database transaction failed:', error)
    throw new Error(`Database operation failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
}
