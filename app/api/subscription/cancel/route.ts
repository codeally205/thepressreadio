import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
import { stripe } from '@/lib/stripe'
import { paystack } from '@/lib/paystack'
import { sendSubscriptionCancelledEmail } from '@/lib/email-sender'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    // Get user's most recent subscription (not just active ones)
    const subscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, session.user.id),
      orderBy: [desc(subscriptions.createdAt)],
    })

    if (!subscription) {
      return NextResponse.json({ error: 'No subscription found' }, { status: 404 })
    }

    // Check if subscription is already cancelled
    if (subscription.status === 'cancelled' || subscription.cancelAtPeriodEnd) {
      return NextResponse.json({ 
        error: 'Subscription is already cancelled',
        subscription: {
          status: subscription.status,
          cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
          currentPeriodEnd: subscription.currentPeriodEnd
        }
      }, { status: 400 })
    }

    // Only allow cancellation of active or trialing subscriptions
    if (subscription.status !== 'active' && subscription.status !== 'trialing') {
      return NextResponse.json({ 
        error: `Cannot cancel subscription with status: ${subscription.status}`,
        currentStatus: subscription.status
      }, { status: 400 })
    }

    console.log(`🔄 Cancelling subscription ${subscription.id} (${subscription.paymentProcessor})`)

    let updatedSubscription

    // Cancel subscription based on payment processor
    if (subscription.paymentProcessor === 'stripe' && subscription.stripeSubscriptionId) {
      try {
        // Cancel at period end for Stripe
        await stripe.subscriptions.update(subscription.stripeSubscriptionId, {
          cancel_at_period_end: true,
        })

        // Update database
        updatedSubscription = await db
          .update(subscriptions)
          .set({
            cancelAtPeriodEnd: true,
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id))
          .returning()

        console.log('✅ Stripe subscription cancelled at period end')

      } catch (stripeError) {
        console.error('❌ Stripe cancellation failed:', stripeError)
        return NextResponse.json({ 
          error: 'Failed to cancel Stripe subscription',
          details: stripeError instanceof Error ? stripeError.message : 'Unknown error'
        }, { status: 500 })
      }

    } else if (subscription.paymentProcessor === 'paystack') {
      try {
        // For Paystack, cancel immediately since we don't have recurring subscriptions set up
        // In a full Paystack implementation, you would cancel the subscription plan
        
        // Update database to cancelled status
        updatedSubscription = await db
          .update(subscriptions)
          .set({
            status: 'cancelled',
            cancelledAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(subscriptions.id, subscription.id))
          .returning()

        console.log('✅ Paystack subscription cancelled immediately')

      } catch (paystackError) {
        console.error('❌ Paystack cancellation failed:', paystackError)
        return NextResponse.json({ 
          error: 'Failed to cancel Paystack subscription',
          details: paystackError instanceof Error ? paystackError.message : 'Unknown error'
        }, { status: 500 })
      }

    } else {
      // Handle subscriptions without external processor IDs (like trials)
      updatedSubscription = await db
        .update(subscriptions)
        .set({
          status: 'cancelled',
          cancelledAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id))
        .returning()

      console.log('✅ Local subscription cancelled immediately')
    }

    // Send cancellation email
    if (session.user.email) {
      try {
        await sendSubscriptionCancelledEmail({
          email: session.user.email,
          name: session.user.name || undefined,
          plan: subscription.plan,
          accessEndsAt: subscription.currentPeriodEnd,
        })
      } catch (emailError) {
        console.error('⚠️ Failed to send cancellation email:', emailError)
        // Don't fail the request if email fails
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Subscription cancelled successfully',
      subscription: updatedSubscription?.[0] || subscription,
      accessUntil: subscription.currentPeriodEnd
    })

  } catch (error) {
    console.error('❌ Subscription cancellation error:', error)
    return NextResponse.json({ 
      error: 'Internal server error during cancellation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}