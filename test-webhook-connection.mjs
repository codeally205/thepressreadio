#!/usr/bin/env node

import dotenv from 'dotenv'

dotenv.config()

async function testWebhookConnection() {
  console.log('🔍 Testing webhook endpoint connection...')
  
  try {
    // Test if the webhook endpoint is accessible
    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'connection' })
    })

    console.log('📡 Webhook endpoint status:', response.status)
    
    if (response.status === 400) {
      console.log('✅ Webhook endpoint is accessible (400 = missing signature, which is expected)')
    } else {
      const text = await response.text()
      console.log('📥 Response:', text)
    }

  } catch (error) {
    if (error.code === 'ECONNREFUSED') {
      console.log('❌ Connection refused - make sure your dev server is running:')
      console.log('   npm run dev')
    } else {
      console.log('❌ Error:', error.message)
    }
  }

  console.log('\n📋 Current webhook secret in .env:')
  console.log('STRIPE_WEBHOOK_SECRET =', process.env.STRIPE_WEBHOOK_SECRET || 'NOT SET')
  
  if (process.env.STRIPE_WEBHOOK_SECRET === 'whsec_YOUR_WEBHOOK_ENDPOINT_SECRET_FROM_STRIPE_CLI') {
    console.log('\n⚠️  You need to update the webhook secret!')
    console.log('Follow these steps:')
    console.log('1. Install Stripe CLI')
    console.log('2. Run: stripe listen --forward-to localhost:3000/api/webhooks/stripe')
    console.log('3. Copy the webhook secret from the output')
    console.log('4. Update STRIPE_WEBHOOK_SECRET in your .env file')
    console.log('5. Restart your dev server')
  }
}

testWebhookConnection()