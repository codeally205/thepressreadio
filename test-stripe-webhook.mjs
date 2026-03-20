#!/usr/bin/env node

import dotenv from 'dotenv'

dotenv.config()

async function testStripeWebhook() {
  try {
    console.log('🧪 Testing Stripe webhook simulation...')
    
    // Simulate a successful payment webhook
    const webhookPayload = {
      id: 'evt_test_' + Date.now(),
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_' + Date.now(),
          customer: 'cus_test_' + Date.now(),
          status: 'active',
          current_period_start: Math.floor(Date.now() / 1000),
          current_period_end: Math.floor((Date.now() + 30 * 24 * 60 * 60 * 1000) / 1000), // 30 days from now
          trial_end: null,
          metadata: {
            email: 'blinktechnologies125@gmail.com',
            plan: 'diaspora_monthly',
            userId: '7a92ae9f-be6a-4b88-ac69-4d8084a1c567'
          }
        }
      }
    }

    console.log('📤 Sending webhook to local endpoint...')
    
    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': 'test_signature' // This will fail signature verification, but we can see the endpoint
      },
      body: JSON.stringify(webhookPayload)
    })

    console.log('📥 Response status:', response.status)
    const responseText = await response.text()
    console.log('📥 Response:', responseText)

  } catch (error) {
    console.error('❌ Error testing webhook:', error.message)
  }
}

testStripeWebhook()