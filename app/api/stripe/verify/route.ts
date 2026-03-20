import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { subscriptions, paymentEvents, users } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const sessionId = searchParams.get('session_id')
  
  if (!sessionId) {
    return NextResponse.json({ error: 'Missing session_id' }, { status: 400 })
  }

  try {
    console.log('🔍 Verifying Stripe checkout session:', sessionId)
    
    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ['subscription', 'customer']
    })
    
    console.log('📋 Checkout session:', {
      id: checkoutSession.id,
      status: checkoutSession.status,
      payment_status: checkoutSession.payment_status,
      customer: typeof checkoutSession.customer === 'string' ? checkoutSession.customer : checkoutSession.customer?.id,
      subscription: typeof checkoutSession.subscription === 'string' ? checkoutSession.subscription : checkoutSession.subscription?.id
    })
    
    if (checkoutSession.payment_status !== 'paid') {
      return NextResponse.json({ 
        error: 'Payment not completed',
        status: checkoutSession.payment_status
      }, { status: 400 })
    }
    
    // Get user by email
    const paymentEmail = checkoutSession.customer_details?.email || session.user.email
    console.log('🔍 Looking up user by email:', paymentEmail)
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, paymentEmail),
    })
    
    if (!user) {
      console.error('❌ User not found for email:', paymentEmail)
      return NextResponse.json({ 
        error: 'User account not found',
        email: paymentEmail
      }, { status: 404 })
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email,
      name: user.name
    })
    
    const userId = user.id
    
    // Check if we already processed this session
    const existingEvent = await db.query.paymentEvents.findFirst({
      where: eq(paymentEvents.processorEventId, `checkout.session-${sessionId}`),
    })
    
    if (existingEvent) {
      console.log('✅ Session already processed')
      return NextResponse.json({ 
        success: true, 
        message: 'Session already processed',
        subscription_created: true
      })
    }
    
    // Get the subscription from Stripe
    const subscriptionId = typeof checkoutSession.subscription === 'string' 
      ? checkoutSession.subscription 
      : checkoutSession.subscription?.id
    
    if (!subscriptionId) {
      return NextResponse.json({ 
        error: 'No subscription found in checkout session'
      }, { status: 400 })
    }
    
    const stripeSubscription = await stripe.subscriptions.retrieve(subscriptionId, {
      expand: ['latest_invoice', 'customer']
    })
    
    // Cast to any to access properties that might not be in the type definition
    const sub = stripeSubscription as any
    
    console.log('📋 Raw Stripe subscription data:', {
      id: sub.id,
      status: sub.status,
      current_period_start: sub.current_period_start,
      current_period_end: sub.current_period_end,
      trial_end: sub.trial_end,
      created: sub.created,
      items: sub.items?.data?.[0]
    })
    
    // ✅ If period dates are missing, use created date and calculate end date
    let periodStart: Date
    let periodEnd: Date
    
    if (sub.current_period_start && sub.current_period_end) {
      periodStart = new Date(sub.current_period_start * 1000)
      periodEnd = new Date(sub.current_period_end * 1000)
    } else {
      // Fallback: use created date and add 1 month
      console.warn('⚠️ Using fallback dates - subscription missing period dates')
      periodStart = new Date(sub.created * 1000)
      periodEnd = new Date(sub.created * 1000)
      periodEnd.setMonth(periodEnd.getMonth() + 1) // Add 1 month for monthly subscription
    }
    
    // ✅ Safely handle trial_end which might be null
    const trialEndDate = sub.trial_end 
      ? new Date(sub.trial_end * 1000) 
      : null
    
    console.log('📋 Stripe subscription dates:', {
      id: sub.id,
      status: sub.status,
      current_period_start: periodStart.toISOString(),
      current_period_end: periodEnd.toISOString(),
      trial_end: trialEndDate ? trialEndDate.toISOString() : null
    })
    
    // Check if subscription already exists
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.stripeSubscriptionId, sub.id)
    })
    
    if (existingSubscription) {
      console.log('✅ Subscription already exists, updating...')
      
      await db.update(subscriptions)
        .set({
          status: sub.status,
          currentPeriodStart: periodStart,
          currentPeriodEnd: periodEnd,
          trialEndsAt: trialEndDate,
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, existingSubscription.id))
      
      console.log('✅ Subscription updated')
    } else {
      console.log('📝 Creating new subscription...')
      
      const plan = checkoutSession.metadata?.plan || sub.metadata?.plan || 'diaspora_monthly'
      const customerId = typeof checkoutSession.customer === 'string' 
        ? checkoutSession.customer 
        : checkoutSession.customer?.id
      
      await db.insert(subscriptions).values({
        userId: userId,
        plan: plan,
        status: sub.status,
        trialEndsAt: trialEndDate,
        currentPeriodStart: periodStart,
        currentPeriodEnd: periodEnd,
        stripeSubscriptionId: sub.id,
        stripeCustomerId: customerId,
        paymentProcessor: 'stripe'
      })
      
      console.log('✅ Subscription created')
    }
    
    // Log the payment event
    await db.insert(paymentEvents).values({
      processor: 'stripe',
      eventType: 'checkout.session.completed',
      processorEventId: `checkout.session-${sessionId}`,
      metadata: {
        sessionId,
        subscriptionId: stripeSubscription.id,
        customerId: typeof checkoutSession.customer === 'string' ? checkoutSession.customer : checkoutSession.customer?.id
      }
    })
    
    console.log('✅ Payment event logged')
    
    return NextResponse.json({ 
      success: true, 
      message: 'Subscription verified and created',
      subscription_id: stripeSubscription.id
    })
    
  } catch (error) {
    console.error('❌ Stripe verification error:', error)
    return NextResponse.json({ 
      error: 'Verification failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
