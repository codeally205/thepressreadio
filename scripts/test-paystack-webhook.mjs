#!/usr/bin/env node

import { config } from 'dotenv'
import { createHmac } from 'crypto'

config()

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

async function testWebhook() {
  console.log('🔗 Testing Paystack webhook...')
  
  // Create a test webhook payload
  const testPayload = {
    event: 'charge.success',
    data: {
      reference: 'test_ref_' + Date.now(),
      amount: 1600, // 16 GHS in pesewas
      currency: 'GHS',
      customer: {
        email: 'alliancedamour88@gmail.com',
        customer_code: 'CUS_test123'
      },
      plan: {
        name: 'continent_monthly'
      },
      authorization: {
        authorization_code: 'AUTH_test123'
      }
    }
  }
  
  const payloadString = JSON.stringify(testPayload)
  
  // Generate signature
  const signature = createHmac('sha512', PAYSTACK_SECRET_KEY)
    .update(payloadString)
    .digest('hex')
  
  console.log('📝 Test payload:', payloadString)
  console.log('🔐 Generated signature:', signature)
  
  try {
    const response = await fetch('http://localhost:3000/api/webhooks/paystack', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-paystack-signature': signature
      },
      body: payloadString
    })
    
    console.log('📡 Webhook response status:', response.status)
    const responseText = await response.text()
    console.log('📡 Webhook response:', responseText)
    
    if (response.status === 200) {
      console.log('✅ Webhook test successful!')
    } else {
      console.log('❌ Webhook test failed')
    }
    
  } catch (error) {
    console.error('❌ Webhook test error:', error.message)
  }
}

testWebhook()