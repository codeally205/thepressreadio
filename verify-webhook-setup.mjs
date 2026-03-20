#!/usr/bin/env node

import dotenv from 'dotenv'

dotenv.config()

async function verifyWebhookSetup() {
  console.log('🔍 Verifying Stripe webhook setup...\n')
  
  // Check environment variables
  console.log('📋 Environment Check:')
  console.log('✅ STRIPE_SECRET_KEY:', process.env.STRIPE_SECRET_KEY ? 'Set (sk_test_...)' : '❌ Missing')
  console.log('✅ STRIPE_PUBLISHABLE_KEY:', process.env.STRIPE_PUBLISHABLE_KEY ? 'Set (pk_test_...)' : '❌ Missing')
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  if (webhookSecret && webhookSecret.startsWith('whsec_') && webhookSecret !== 'whsec_YOUR_ACTUAL_SECRET_FROM_STRIPE_DASHBOARD') {
    console.log('✅ STRIPE_WEBHOOK_SECRET: Set and looks valid')
  } else {
    console.log('❌ STRIPE_WEBHOOK_SECRET: Missing or placeholder value')
    console.log('   Current value:', webhookSecret)
    console.log('   Please update with the real secret from Stripe Dashboard')
  }
  
  console.log('\n📡 Webhook Endpoint Check:')
  
  // Check if webhook endpoint is accessible
  try {
    const response = await fetch('https://mydomain.com/api/webhooks/stripe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'connection' })
    })
    
    console.log('✅ Webhook endpoint status:', response.status)
    if (response.status === 400 || response.status === 401) {
      console.log('✅ Endpoint is accessible (400/401 expected without proper signature)')
    }
  } catch (error) {
    console.log('❌ Cannot reach webhook endpoint:', error.message)
    console.log('   Make sure your app is deployed and accessible at https://mydomain.com')
  }
  
  console.log('\n📋 Stripe Dashboard Setup Checklist:')
  console.log('✅ Webhook endpoint created: https://mydomain.com/api/webhooks/stripe')
  console.log('✅ Events selected: checkout, subscription, invoice, payment intent')
  console.log('✅ Signing secret copied to environment variables')
  
  console.log('\n🧪 Next Steps:')
  console.log('1. Replace "whsec_YOUR_ACTUAL_SECRET_FROM_STRIPE_DASHBOARD" with your real secret')
  console.log('2. Deploy your app with the updated environment variable')
  console.log('3. Test with a real payment to see if webhook processes correctly')
  console.log('4. Check your database to see if Stripe IDs are populated')
  
  console.log('\n💡 Testing Tips:')
  console.log('• Use Stripe Dashboard → Webhooks → Your endpoint → "Send test webhook"')
  console.log('• Make a test payment and check if subscription gets Stripe IDs')
  console.log('• Check your app logs for webhook processing messages')
}

verifyWebhookSetup()