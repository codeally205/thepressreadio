#!/usr/bin/env node

import crypto from 'crypto'
import dotenv from 'dotenv'
import fs from 'fs'

dotenv.config()

function generateWebhookSecret() {
  // Generate a proper webhook secret similar to Stripe's format
  const randomBytes = crypto.randomBytes(32)
  const secret = 'whsec_' + randomBytes.toString('hex')
  return secret
}

function updateEnvFile(newSecret) {
  try {
    let envContent = fs.readFileSync('.env', 'utf8')
    
    // Replace the webhook secret
    envContent = envContent.replace(
      /STRIPE_WEBHOOK_SECRET=.*/,
      `STRIPE_WEBHOOK_SECRET=${newSecret}`
    )
    
    fs.writeFileSync('.env', envContent)
    console.log('✅ Updated .env file with new webhook secret')
  } catch (error) {
    console.error('❌ Error updating .env file:', error)
  }
}

async function testWebhookEndpoint(secret) {
  try {
    console.log('🧪 Testing webhook endpoint with new secret...')
    
    // Create a proper Stripe webhook payload
    const timestamp = Math.floor(Date.now() / 1000)
    const payload = JSON.stringify({
      id: 'evt_test_webhook_' + Date.now(),
      object: 'event',
      api_version: '2020-08-27',
      created: timestamp,
      type: 'customer.subscription.created',
      data: {
        object: {
          id: 'sub_test_' + Date.now(),
          object: 'subscription',
          customer: 'cus_test_' + Date.now(),
          status: 'active',
          current_period_start: timestamp,
          current_period_end: timestamp + (30 * 24 * 60 * 60), // 30 days
          trial_end: null,
          metadata: {
            email: 'blinktechnologies125@gmail.com',
            plan: 'diaspora_monthly',
            userId: 'ef20c7b4-89d0-4132-bfee-218e865f1bed'
          }
        }
      }
    })

    // Create proper Stripe signature
    const signedPayload = timestamp + '.' + payload
    const signature = crypto
      .createHmac('sha256', secret.replace('whsec_', ''))
      .update(signedPayload, 'utf8')
      .digest('hex')
    
    const stripeSignature = `t=${timestamp},v1=${signature}`

    console.log('📤 Sending test webhook...')
    console.log('Payload length:', payload.length)
    console.log('Signature:', stripeSignature)

    const response = await fetch('http://localhost:3000/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'stripe-signature': stripeSignature
      },
      body: payload
    })

    console.log('📥 Response status:', response.status)
    const responseText = await response.text()
    console.log('📥 Response:', responseText)

    if (response.ok) {
      console.log('✅ Webhook test successful!')
    } else {
      console.log('❌ Webhook test failed')
    }

  } catch (error) {
    console.error('❌ Error testing webhook:', error)
  }
}

async function setupStripeWebhook() {
  console.log('🔧 Setting up Stripe webhook...')
  
  // Generate new webhook secret
  const newSecret = generateWebhookSecret()
  console.log('🔑 Generated new webhook secret:', newSecret.substring(0, 20) + '...')
  
  // Update .env file
  updateEnvFile(newSecret)
  
  // Wait a moment for the server to pick up the new env var
  console.log('⏳ Waiting for server to reload...')
  await new Promise(resolve => setTimeout(resolve, 2000))
  
  // Test the webhook
  await testWebhookEndpoint(newSecret)
  
  console.log('\n📋 Next steps:')
  console.log('1. Restart your development server to pick up the new webhook secret')
  console.log('2. For production, create a webhook endpoint in Stripe Dashboard')
  console.log('3. Use this URL: https://yourdomain.com/api/webhooks/stripe')
  console.log('4. Select these events: customer.subscription.*, invoice.payment_*')
}

setupStripeWebhook()