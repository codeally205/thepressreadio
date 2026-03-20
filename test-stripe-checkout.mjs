#!/usr/bin/env node

import Stripe from 'stripe'
import dotenv from 'dotenv'

dotenv.config()

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

async function testStripeCheckout() {
  try {
    console.log('🧪 Testing Stripe checkout session creation...')
    
    // Create a simple test checkout session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Test Subscription',
            },
            unit_amount: 999, // $9.99
            recurring: {
              interval: 'month',
            },
          },
          quantity: 1,
        },
      ],
      success_url: 'http://localhost:3000/account?success=true',
      cancel_url: 'http://localhost:3000/subscribe?canceled=true',
    })

    console.log('✅ Checkout session created successfully!')
    console.log('Session ID:', session.id)
    console.log('Checkout URL:', session.url)
    console.log('\nYou can test this URL in your browser.')

  } catch (error) {
    console.error('❌ Error creating checkout session:', error.message)
    
    if (error.code) {
      console.error('Error code:', error.code)
    }
    
    if (error.type) {
      console.error('Error type:', error.type)
    }
  }
}

testStripeCheckout()