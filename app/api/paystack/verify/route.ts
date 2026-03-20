import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paystack } from '@/lib/paystack'
import { db } from '@/lib/db'
import { subscriptions, paymentEvents, users } from '@/lib/db/schema'
import { eq, and, desc } from 'drizzle-orm'
import { 
  createPaymentIdempotencyKey,
  calculatePeriodEndDate,
  isValidPlan,
  getUserTrialInfo
} from '@/lib/subscription-utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const reference = searchParams.get('reference')
  
  if (!reference) {
    return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
  }

  try {
    console.log('🔍 Verifying Paystack transaction:', reference)
    
    // Verify transaction with Paystack
    const verification = await paystack.verifyTransaction(reference)
    
    console.log('📋 Verification result:', JSON.stringify(verification, null, 2))
    
    if (!verification.status || verification.data.status !== 'success') {
      return NextResponse.json({ 
        error: 'Transaction verification failed',
        details: verification 
      }, { status: 400 })
    }
    
    const transactionData = verification.data
    
    // ✅ CRITICAL: Get user by email from transaction (more reliable than session user ID)
    const paymentEmail = transactionData.customer?.email || session.user.email
    console.log('🔍 Looking up user by email:', paymentEmail)
    
    const user = await db.query.users.findFirst({
      where: eq(users.email, paymentEmail),
    })
    
    if (!user) {
      console.error('❌ CRITICAL: User not found for email:', paymentEmail)
      console.error('Transaction data:', JSON.stringify(transactionData, null, 2))
      
      return NextResponse.json({ 
        error: 'User account not found. Please sign up before subscribing.',
        details: 'No user account found with the email used for payment. Please ensure you are signed in with the same email you used for payment.',
        email: paymentEmail,
        action: 'Please sign out and sign in with the correct email'
      }, { status: 404 })
    }
    
    console.log('✅ User found by email:', {
      id: user.id,
      email: user.email,
      name: user.name,
      provider: user.authProvider
    })
    
    // Use the user ID from database lookup, not from session
    const userId = user.id
    
    // Create improved idempotency key
    const mockEvent = {
      event: 'charge.success',
      data: {
        reference,
        id: String(transactionData.id || transactionData.reference || reference)
      }
    }
    const idempotencyKey = createPaymentIdempotencyKey(mockEvent)
    
    console.log('🔑 Idempotency key:', idempotencyKey)
    
    // Check if we already processed this transaction
    try {
      const existingEvent = await db.query.paymentEvents.findFirst({
        where: eq(paymentEvents.processorEventId, idempotencyKey),
      })
      
      if (existingEvent) {
        console.log('✅ Transaction already processed')
        return NextResponse.json({ 
          success: true, 
          message: 'Transaction already processed',
          subscription_created: true
        })
      }
    } catch (dbError) {
      console.error('⚠️ Error checking existing event:', dbError)
      // Continue anyway - we'll create the subscription
    }
    
    // Check if user already has a subscription (using userId from email lookup)
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        eq(subscriptions.paymentProcessor, 'paystack')
      ),
      orderBy: [desc(subscriptions.createdAt)],
    })
    
    if (existingSubscription) {
      console.log('📝 Updating existing subscription:', existingSubscription.id)
      
      // Extract plan from metadata
      const plan = transactionData.metadata?.plan || existingSubscription.plan
      
      // Update existing subscription to active
      const updatedSubscription = await db
        .update(subscriptions)
        .set({
          status: 'active',
          plan: plan, // Update plan in case it changed
          paystackCustomerCode: transactionData.customer?.customer_code || existingSubscription.paystackCustomerCode,
          currentPeriodEnd: calculatePeriodEndDate(plan),
          paymentReference: reference,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, existingSubscription.id))
        .returning()
      
      // Log the payment event
      try {
        await db.insert(paymentEvents).values({
          processor: 'paystack',
          eventType: 'charge.success',
          processorEventId: idempotencyKey,
          amount: transactionData.amount,
          currency: transactionData.currency,
          status: 'success',
          metadata: verification,
        })
        console.log('✅ Payment event logged')
      } catch (eventError) {
        console.error('⚠️ Failed to log payment event:', eventError)
        // Don't fail the request if event logging fails
      }
      
      console.log('✅ Subscription updated to active:', {
        subscriptionId: updatedSubscription[0]?.id,
        previousStatus: existingSubscription.status,
        newStatus: 'active',
        plan: plan
      })
      
      return NextResponse.json({ 
        success: true, 
        message: 'Subscription activated successfully',
        subscription_id: updatedSubscription[0]?.id,
        updated: true
      })
    }
    
    // Create subscription record if it doesn't exist
    console.log('📝 Creating subscription record for user:', userId)
    
    // Extract plan from metadata
    const plan = transactionData.metadata?.plan || 'continent_monthly'
    
    // Validate plan
    if (!isValidPlan(plan)) {
      return NextResponse.json({ 
        error: 'Invalid plan specified',
        plan 
      }, { status: 400 })
    }
    
    // Validate that diaspora plans don't use Paystack
    if (plan.startsWith('diaspora')) {
      return NextResponse.json({ 
        error: 'Diaspora plans should use Stripe, not Paystack',
        plan 
      }, { status: 400 })
    }
    
    // Check if user has had any previous subscriptions for trial eligibility (using userId from email lookup)
    const trialInfo = await getUserTrialInfo(userId)
    
    const hasHadTrial = trialInfo.hasHadTrial
    const trialEndsAt = trialInfo.trialEndsAt
    const status = trialInfo.status
    const currentPeriodEnd = calculatePeriodEndDate(plan)
    
    const newSubscription = await db.insert(subscriptions).values({
      userId: userId,
      plan: plan,
      status,
      trialEndsAt,
      currentPeriodStart: new Date(),
      currentPeriodEnd,
      paystackCustomerCode: transactionData.customer?.customer_code,
      paymentReference: reference,
      paymentProcessor: 'paystack',
    }).returning()
    
    console.log('✅ Subscription created:', {
      subscriptionId: newSubscription[0]?.id,
      plan,
      status,
      hasTrialPeriod: !!trialEndsAt,
      trialEndsAt
    })
    
    // Log the payment event
    try {
      await db.insert(paymentEvents).values({
        processor: 'paystack',
        eventType: 'charge.success',
        processorEventId: idempotencyKey,
        amount: transactionData.amount,
        currency: transactionData.currency,
        status: 'success',
        metadata: verification,
      })
      console.log('✅ Payment event logged')
    } catch (eventError) {
      console.error('⚠️ Failed to log payment event:', eventError)
      // Don't fail the request if event logging fails
    }
    
    return NextResponse.json({ 
      success: true, 
      message: 'Transaction verified and subscription created',
      transaction: transactionData,
      subscription_id: newSubscription[0]?.id
    })
    
  } catch (error) {
    console.error('❌ Transaction verification error:', error)
    return NextResponse.json({ 
      error: 'Verification failed', 
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  // Handle manual verification with reference
  const session = await auth()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { reference } = await req.json()
    
    if (!reference) {
      return NextResponse.json({ error: 'Missing reference' }, { status: 400 })
    }
    
    // Redirect to GET endpoint
    return NextResponse.redirect(`${req.nextUrl.origin}/api/paystack/verify?reference=${reference}`)
    
  } catch (error) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }
}