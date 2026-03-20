import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { paystack } from '@/lib/paystack'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'
import { getUserTrialInfo } from '@/lib/subscription-utils'

export async function POST(req: NextRequest) {
  const session = await auth()

  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const formData = await req.formData()
    const plan = formData.get('plan') as string
    const startTrial = formData.get('startTrial') === 'true'

    console.log('Checkout request for plan:', plan, 'startTrial:', startTrial)
    console.log('User email:', session.user.email)

    if (!plan || !SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      console.error('Invalid plan:', plan)
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }

    // Validate that diaspora plans don't use Paystack
    if (plan.startsWith('diaspora')) {
      return NextResponse.json({ 
        error: 'Diaspora plans should use Stripe, not Paystack',
        plan 
      }, { status: 400 })
    }

    const planConfig = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]
    console.log('Plan config:', planConfig)

    // Use standardized trial logic
    const trialInfo = await getUserTrialInfo(session.user.id)
    console.log('Trial info:', trialInfo)

    // If user is eligible for trial and wants to start trial, create trial subscription
    if (startTrial && trialInfo.isEligibleForTrial) {
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
          
          // Return JSON with redirect URL instead of redirecting
          return NextResponse.json({ 
            success: true,
            trial: true,
            redirectUrl: `/account?trial=started`,
            subscription: trialData.subscription
          })
        } else {
          const errorData = await trialResponse.json()
          console.error('Failed to create trial subscription:', errorData)
          
          // If user already has subscription or is not eligible, return error
          if (errorData.hasHadTrial) {
            return NextResponse.json({ 
              error: 'You have already used your free trial',
              hasHadTrial: true 
            }, { status: 400 })
          }
          if (errorData.subscription) {
            return NextResponse.json({ 
              error: 'You already have an active subscription',
              subscription: errorData.subscription 
            }, { status: 400 })
          }
          
          // Fall through to regular payment flow for other errors
        }
      } catch (error) {
        console.error('Error creating trial:', error)
        // Fall through to regular payment flow
      }
    }

    // Regular payment flow (for users not eligible for trial or choosing to pay immediately)
    // For subscriptions, we need to create a customer first, then initialize transaction
    let customerCode = null
    
    try {
      // Try to create or get customer
      const customerResponse = await paystack.createCustomer({
        email: session.user.email,
        first_name: session.user.name?.split(' ')[0] || 'User',
        last_name: session.user.name?.split(' ').slice(1).join(' ') || '',
      })
      
      if (customerResponse.status) {
        customerCode = customerResponse.data.customer_code
        console.log('Customer created/found:', customerCode)
      }
    } catch (customerError) {
      console.log('Customer creation failed, proceeding with transaction:', customerError)
    }

    // Prepare transaction data
    const transactionData: any = {
      email: session.user.email,
      amount: planConfig.price * 100, // Convert to pesewas for GHS (smallest unit)
      currency: planConfig.currency, // Use currency from plan config
      callback_url: `${process.env.NEXTAUTH_URL}/account?success=true`,
      metadata: {
        plan: plan,
        user_id: session.user.id,
        user_email: session.user.email, // ✅ Add email to metadata for verification
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: plan
          },
          {
            display_name: "User Email",
            variable_name: "user_email",
            value: session.user.email
          }
        ]
      }
    }

    // Add customer code if available
    if (customerCode) {
      transactionData.customer = customerCode
    }

    console.log('Transaction data:', JSON.stringify(transactionData, null, 2))

    // Initialize Paystack transaction
    const response = await paystack.initializeTransaction(transactionData)
    
    console.log('Paystack response:', JSON.stringify(response, null, 2))

    if (response.status && response.data.authorization_url) {
      console.log('✅ Paystack checkout URL created:', response.data.authorization_url)
      // Return JSON with checkout URL instead of redirecting
      // This allows the frontend to handle the redirect properly
      return NextResponse.json({ 
        success: true,
        checkoutUrl: response.data.authorization_url,
        reference: response.data.reference
      })
    }

    console.error('Paystack initialization failed:', response)
    return NextResponse.json(
      { error: 'Failed to initialize payment', details: response },
      { status: 500 }
    )
  } catch (error) {
    console.error('Paystack checkout error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: 'Failed to create checkout session', details: errorMessage },
      { status: 500 }
    )
  }
}
