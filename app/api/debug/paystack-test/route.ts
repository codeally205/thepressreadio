import { NextRequest, NextResponse } from 'next/server'
import { paystack } from '@/lib/paystack'
import { SUBSCRIPTION_PLANS } from '@/lib/constants'

export async function GET(req: NextRequest) {
  try {
    console.log('🔍 Testing Paystack integration...')
    
    // Test 1: Check environment variables
    const hasSecretKey = !!process.env.PAYSTACK_SECRET_KEY
    const hasPublicKey = !!process.env.PAYSTACK_PUBLIC_KEY
    
    console.log('Environment check:', { hasSecretKey, hasPublicKey })
    
    // Test 2: Check subscription plans
    console.log('Subscription plans:', SUBSCRIPTION_PLANS)
    
    // Test 3: Test customer creation
    let customerTest = null
    try {
      const customerResponse = await paystack.createCustomer({
        email: 'debug@test.com',
        first_name: 'Debug',
        last_name: 'User'
      })
      customerTest = { success: true, data: customerResponse }
      console.log('Customer creation test:', customerTest)
    } catch (error) {
      customerTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      console.error('Customer creation failed:', error)
    }
    
    // Test 4: Test transaction initialization
    let transactionTest = null
    try {
      const transactionResponse = await paystack.initializeTransaction({
        email: 'debug@test.com',
        amount: 100, // $1 in kobo
        currency: 'USD',
        callback_url: `${process.env.NEXTAUTH_URL}/account?success=true`,
        metadata: {
          plan: 'continent_monthly',
          test: true
        }
      })
      transactionTest = { success: true, data: transactionResponse }
      console.log('Transaction initialization test:', transactionTest)
    } catch (error) {
      transactionTest = { success: false, error: error instanceof Error ? error.message : 'Unknown error' }
      console.error('Transaction initialization failed:', error)
    }
    
    return NextResponse.json({
      status: 'debug',
      environment: {
        hasSecretKey,
        hasPublicKey,
        nextAuthUrl: process.env.NEXTAUTH_URL
      },
      plans: SUBSCRIPTION_PLANS,
      tests: {
        customer: customerTest,
        transaction: transactionTest
      }
    })
    
  } catch (error) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      error: 'Debug test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { plan = 'continent_monthly' } = body
    
    console.log('🧪 Testing checkout flow for plan:', plan)
    
    if (!SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]) {
      return NextResponse.json({ error: 'Invalid plan' }, { status: 400 })
    }
    
    const planConfig = SUBSCRIPTION_PLANS[plan as keyof typeof SUBSCRIPTION_PLANS]
    
    // Create test customer
    const customerResponse = await paystack.createCustomer({
      email: 'test-checkout@example.com',
      first_name: 'Test',
      last_name: 'Checkout'
    })
    
    if (!customerResponse.status) {
      throw new Error('Failed to create customer: ' + JSON.stringify(customerResponse))
    }
    
    // Initialize transaction
    const transactionResponse = await paystack.initializeTransaction({
      email: 'test-checkout@example.com',
      amount: planConfig.price * 100,
      currency: 'USD',
      customer: customerResponse.data.customer_code,
      callback_url: `${process.env.NEXTAUTH_URL}/account?success=true`,
      metadata: {
        plan: plan,
        test_mode: true,
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan", 
            value: plan
          }
        ]
      }
    })
    
    return NextResponse.json({
      success: true,
      customer: customerResponse.data,
      transaction: transactionResponse.data,
      checkout_url: transactionResponse.data.authorization_url
    })
    
  } catch (error) {
    console.error('Checkout test error:', error)
    return NextResponse.json({
      error: 'Checkout test failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}