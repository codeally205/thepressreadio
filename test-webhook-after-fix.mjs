#!/usr/bin/env node

import dotenv from 'dotenv'

dotenv.config()

async function testWebhookAfterFix() {
  console.log('🧪 Testing webhook after Cloudflare fix...\n')
  
  const webhookUrl = 'https://yourdomain.com/api/webhooks/stripe'
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Stripe/1.0 (+https://stripe.com/docs/webhooks)'
      },
      body: JSON.stringify({ test: 'connection' })
    })
    
    console.log('✅ Response status:', response.status)
    const responseText = await response.text()
    
    if (response.status === 400 || response.status === 401) {
      console.log('✅ Webhook endpoint is now accessible!')
      console.log('Expected 400/401 for missing signature')
    } else if (responseText.includes('cloudflare') || responseText.includes('captcha')) {
      console.log('❌ Still blocked by Cloudflare')
      console.log('Try the solutions above')
    } else {
      console.log('Response preview:', responseText.substring(0, 200))
    }
    
  } catch (error) {
    console.log('❌ Error:', error.message)
  }
}

testWebhookAfterFix()