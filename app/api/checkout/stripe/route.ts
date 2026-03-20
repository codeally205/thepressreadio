import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { db } from '@/lib/db'
import { users, subscriptions } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'
import { getUserTrialInfo } from '@/lib/subscription-utils'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const plan = formData.get('plan') as string
    const startTrial = formData.get('startTrial') === 'true'

    console.log('🔍 Stripe checkout request:', {
      email: session.user.email,
      plan,
      startTrial
    })

    if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Validate that continent plans don't use Stripe
    if (plan.startsWith('continent')) {
      return NextResponse.json({ 
        error: 'Continent plans should use Paystack, not Stripe',
        plan 
      }, { status: 400 })
    }

    const planConfig = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]

    // ✅ Use email-based lookup for consistency
    const user = await db.query.users.findFirst({
      where: eq(users.email, session.user.email),
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const userId = user.id

    // Use standardized trial logic
    const trialInfo = await getUserTrialInfo(userId)

    console.log('🔍 Trial info:', trialInfo)

    // ✅ If user is eligible for trial and wants to start trial, create trial subscription
    if (startTrial && trialInfo.isEligibleForTrial) {
      console.log('✅ User eligible for trial - creating trial subscription')
      
      try {
        const trialResponse = await fetch(`${process.env.NEXTAUTH_URL}/api/subscription/create-trial`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Cookie': req.headers.get('cookie') || '',
          },
          body: JSON.stringify({ plan })
        })

        if (trialResponse.ok) {
          const trialData = await trialResponse.json()
          console.log('✅ Trial subscription created successfully:', trialData)
          
          // ✅ Return immediately - DO NOT fall through to Stripe checkout
          return NextResponse.json({ 
            success: true,
            trial: true,
            redirectUrl: trialData.redirectUrl || `/account?trial=started`,
            subscription: trialData.subscription
          })
        } else {
          const errorData = await trialResponse.json()
          console.error('❌ Failed to create trial subscription:', errorData)
          
          // If user already has subscription or is not eligible, return error
          if (errorData.hasHadTrial || errorData.subscription) {
            return NextResponse.json({ 
              error: errorData.error,
              hasHadTrial: errorData.hasHadTrial,
              subscription: errorData.subscription
            }, { status: 400 })
          }
          
          // Fall through to regular payment flow for other errors
          console.log('⚠️ Trial creation failed, falling through to payment flow')
        }
      } catch (error) {
        console.error('❌ Error creating trial:', error)
        // Fall through to regular payment flow
        console.log('⚠️ Trial creation error, falling through to payment flow')
      }
    } else if (startTrial && !trialInfo.isEligibleForTrial) {
      // ✅ User requested trial but not eligible
      console.log('❌ User not eligible for trial - they already had one')
      return NextResponse.json({ 
        error: 'You have already used your free trial. Please subscribe to continue.',
        hasHadTrial: true
      }, { status: 400 })
    }

    // ✅ Regular payment flow (for users not eligible for trial or choosing to pay immediately)
    console.log('💳 Creating Stripe checkout session for immediate payment')
    
    // Get or create Stripe customer
    let customerId: string

    const existingCustomers = await stripe.customers.list({
      email: session.user.email,
      limit: 1,
    })

    if (existingCustomers.data.length > 0) {
      customerId = existingCustomers.data[0].id
      console.log('✅ Found existing Stripe customer:', customerId)
    } else {
      const customer = await stripe.customers.create({
        email: session.user.email,
        name: user.name || undefined,
      })
      customerId = customer.id
      console.log('✅ Created new Stripe customer:', customerId)
    }

    // Create checkout session
    console.log('Creating checkout session with:', {
      customerId,
      plan: planConfig.name,
      price: planConfig.price,
      currency: planConfig.currency,
      userId: userId,
      email: session.user.email
    })

    const checkoutSession = await stripe.checkout.sessions.create({
      customer: customerId,
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: planConfig.currency.toLowerCase(),
            product_data: {
              name: planConfig.name,
              description: 'Unlimited access to premium African news and analysis',
            },
            unit_amount: planConfig.price * 100, // Convert to cents
            recurring: {
              interval: planConfig.interval as 'month' | 'year',
            },
          },
          quantity: 1,
        },
      ],
      subscription_data: {
        // ✅ NO trial in Stripe checkout - trial is handled separately
        trial_period_days: undefined,
        metadata: {
          userId: userId,
          email: session.user.email,
          plan: plan,
        },
      },
      success_url: `${process.env.NEXTAUTH_URL}/account?success=true`,
      cancel_url: `${process.env.NEXTAUTH_URL}/subscribe?canceled=true`,
      metadata: {
        userId: userId,
        email: session.user.email,
        plan: plan,
      },
    })

    console.log('✅ Checkout session created:', checkoutSession.id)
    console.log('Checkout URL:', checkoutSession.url)

    return NextResponse.json({ 
      success: true, 
      checkoutUrl: checkoutSession.url 
    })
  } catch (error) {
    console.error('❌ Stripe checkout error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: errorMessage },
      { status: 500 }
    )
  }
}
