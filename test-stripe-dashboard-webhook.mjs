#!/usr/bin/env node

import dotenv from 'dotenv'

dotenv.config()

async function testStripeDashboardWebhook() {
  console.log('🧪 Testing Stripe Dashboard webhook...\n')
  
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET
  
  if (!webhookSecret || webhookSecret === 'whsec_YOUR_ACTUAL_SECRET_FROM_STRIPE_DASHBOARD') {
    console.log('❌ Please update STRIPE_WEBHOOK_SECRET in your .env file first!')
    console.log('   Go to Stripe Dashboard → Webhooks → Your endpoint → Reveal signing secret')
    console.log('   Copy the secret and update your .env file')
    return
  }
  
  console.log('✅ Webhook secret is configured')
  console.log('Secret preview:', webhookSecret.substring(0, 15) + '...')
  
  console.log('\n📋 How to test your webhook:')
  console.log('\n1. Go to Stripe Dashboard:')
  console.log('   https://dashboard.stripe.com/test/webhooks')
  
  console.log('\n2. Click on your webhook endpoint')
  
  console.log('\n3. Click "Send test webhook"')
  
  console.log('\n4. Select event type: "customer.subscription.created"')
  
  console.log('\n5. Click "Send test webhook"')
  
  console.log('\n6. Check the response - should be 200 OK')
  
  console.log('\n7. Check your database to see if a test subscription was created')
  
  console.log('\n🔍 To monitor webhook events:')
  console.log('• Check your app logs for webhook processing messages')
  console.log('• Run: node check-payment-events.mjs (to see processed events)')
  console.log('• Check Stripe Dashboard → Webhooks → Your endpoint → Recent deliveries')
  
  console.log('\n💡 For real payment testing:')
  console.log('• Make a test payment on your site')
  console.log('• Check if your subscription gets updated with Stripe IDs')
  console.log('• Run: node check-user-subscription.mjs (to verify)')
}

testStripeDashboardWebhook()