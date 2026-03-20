import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { subscriptions, users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { getUserTrialInfo, calculatePeriodEndDate } from '@/lib/subscription-utils'
import { sendSubscriptionWelcomeEmail } from '@/lib/email-sender'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const { plan } = await req.json()

    if (!plan) {
      return NextResponse.json({ error: 'Plan is required' }, { status: 400 })
    }

    // ✅ Use email-based lookup for consistency
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user.id

    // Check trial eligibility
    const trialInfo = await getUserTrialInfo(userId)
    
    console.log('🔍 Trial creation request:', {
      email: session.user.email,
      userId,
      plan,
      trialInfo
    })
    
    if (!trialInfo.isEligibleForTrial) {
      console.log('❌ User not eligible for trial')
      return NextResponse.json({ 
        error: 'You have already used your free trial. Please subscribe to continue.',
        hasHadTrial: true 
      }, { status: 400 })
    }

    // Check if user already has an active subscription
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    })

    if (existingSubscription && (existingSubscription.status === 'active' || existingSubscription.status === 'trialing')) {
      console.log('❌ User already has active subscription')
      return NextResponse.json({ 
        error: 'You already have an active subscription',
        subscription: existingSubscription 
      }, { status: 400 })
    }

    // Create trial subscription
    const currentPeriodEnd = calculatePeriodEndDate(plan)
    
    // Determine payment processor based on plan
    const paymentProcessor = plan.startsWith('diaspora') ? 'stripe' : 'paystack'
    
    const newSubscription = await db.insert(subscriptions).values({
      userId: userId,
      plan: plan,
      status: 'trialing',
      trialEndsAt: trialInfo.trialEndsAt,
      currentPeriodStart: new Date(),
      currentPeriodEnd: currentPeriodEnd,
      paymentProcessor: paymentProcessor,
      createdAt: new Date(),
      updatedAt: new Date(),
    }).returning()

    console.log('✅ Trial subscription created:', {
      userId: userId,
      email: session.user.email,
      plan: plan,
      status: 'trialing',
      trialEndsAt: trialInfo.trialEndsAt,
      paymentProcessor: paymentProcessor
    })

    // Send welcome email with trial information
    try {
      await sendSubscriptionWelcomeEmail({
        email: session.user.email,
        name: session.user.name || undefined,
        plan: plan,
        trialEndsAt: trialInfo.trialEndsAt || undefined,
      })
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError)
      // Don't fail the request if email fails
    }

    return NextResponse.json({ 
      success: true,
      subscription: newSubscription[0],
      trialEndsAt: trialInfo.trialEndsAt,
      redirectUrl: '/account?trial=started'
    })

  } catch (error) {
    console.error('Trial subscription creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create trial subscription' },
      { status: 500 }
    )
  }
}