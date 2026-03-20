#!/usr/bin/env node

import { config } from 'dotenv'
config()

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET_KEY) {
  console.error('❌ PAYSTACK_SECRET_KEY not found in environment variables')
  process.exit(1)
}

console.log('🔍 Debugging Paystack Authentication...')
console.log('🔑 API Key:', PAYSTACK_SECRET_KEY.substring(0, 15) + '...')
console.log('🔑 Key Type:', PAYSTACK_SECRET_KEY.startsWith('sk_test_') ? 'TEST' : PAYSTACK_SECRET_KEY.startsWith('sk_live_') ? 'LIVE' : 'UNKNOWN')

async function debugPaystackAuth() {
  const baseUrl = 'https://api.paystack.co'
  
  // Test 1: Basic API connectivity
  console.log('\n🌐 Test 1: Basic API connectivity...')
  try {
    const response = await fetch(`${baseUrl}/transaction`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    
    console.log('Response Status:', response.status)
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()))
    
    if (response.status === 401) {
      console.log('❌ UNAUTHORIZED - Invalid API key')
      return
    } else if (response.status === 403) {
      console.log('❌ FORBIDDEN - API key lacks permissions or account issue')
      return
    } else if (response.status === 200) {
      console.log('✅ API key is valid')
    }
    
    const data = await response.json()
    console.log('Response Data:', JSON.stringify(data, null, 2))
    
  } catch (error) {
    console.error('❌ API connectivity failed:', error.message)
    return
  }
  
  // Test 2: Simple customer creation
  console.log('\n👤 Test 2: Customer creation...')
  try {
    const response = await fetch(`${baseUrl}/customer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'debug-test@example.com',
        first_name: 'Debug',
        last_name: 'Test'
      })
    })
    
    console.log('Customer Creation Status:', response.status)
    const customerData = await response.json()
    console.log('Customer Response:', JSON.stringify(customerData, null, 2))
    
    if (response.status === 200 && customerData.status) {
      console.log('✅ Customer creation successful')
      
      // Test 3: Simple transaction initialization
      console.log('\n💳 Test 3: Transaction initialization...')
      const txResponse = await fetch(`${baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'debug-test@example.com',
          amount: 100,
          currency: 'USD'
        })
      })
      
      console.log('Transaction Status:', txResponse.status)
      const txData = await txResponse.json()
      console.log('Transaction Response:', JSON.stringify(txData, null, 2))
      
      if (txResponse.status === 200 && txData.status) {
        console.log('✅ Transaction initialization successful')
      } else {
        console.log('❌ Transaction initialization failed')
        if (txData.message) {
          console.log('Error Message:', txData.message)
        }
      }
    } else {
      console.log('❌ Customer creation failed')
    }
    
  } catch (error) {
    console.error('❌ Customer/Transaction test failed:', error.message)
  }
  
  // Test 4: Check account balance/info
  console.log('\n💰 Test 4: Account information...')
  try {
    const response = await fetch(`${baseUrl}/balance`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    
    console.log('Balance Check Status:', response.status)
    const balanceData = await response.json()
    console.log('Balance Response:', JSON.stringify(balanceData, null, 2))
    
  } catch (error) {
    console.error('❌ Balance check failed:', error.message)
  }
}

debugPaystackAuth().then(() => {
  console.log('\n✨ Debug completed!')
}).catch(error => {
  console.error('💥 Debug failed:', error)
})