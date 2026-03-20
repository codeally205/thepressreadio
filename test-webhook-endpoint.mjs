#!/usr/bin/env node

import dotenv from 'dotenv'

dotenv.config()

async function testWebhookEndpoint() {
  console.log('🔍 Testing webhook endpoint accessibility...\n')
  
  const webhookUrl = 'https://mydomain.com/api/webhooks/stripe'
  
  console.log('Testing URL:', webhookUrl)
  
  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ test: 'connection' })
    })
    
    console.log('✅ Response status:', response.status)
    
    if (response.status === 400) {
      console.log('✅ Endpoint is accessible (400 = missing signature, expected)')
    } else if (response.status === 401) {
      console.log('✅ Endpoint is accessible (401 = invalid signature, expected)')
    } else if (response.status === 404) {
      console.log('❌ Endpoint not found - check your deployment')
    } else if (response.status === 500) {
      console.log('❌ Server error - check your app logs')
    }
    
    const responseText = await response.text()
    console.log('Response:', responseText)
    
  } catch (error) {
    console.log('❌ Cannot reach endpoint:', error.message)
    console.log('\nPossible issues:')
    console.log('• App is not deployed')
    console.log('• Wrong domain name')
    console.log('• SSL certificate issues')
    console.log('• Firewall blocking requests')
  }
  
  console.log('\n📋 Checklist:')
  console.log('1. ✅ Is your app deployed and running?')
  console.log('2. ✅ Is the domain correct in Stripe Dashboard?')
  console.log('3. ✅ Does https://mydomain.com work in browser?')
  console.log('4. ✅ Is the webhook secret updated in production environment?')
}

testWebhookEndpoint()