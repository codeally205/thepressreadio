#!/usr/bin/env node

import { config } from 'dotenv'
config()

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

console.log('🇬🇭 Testing GHS Currency with Paystack...')

async function testGHSTransaction() {
  const baseUrl = 'https://api.paystack.co'
  
  // Test 1: Simple GHS transaction
  console.log('\n💰 Test 1: GHS Transaction Initialization...')
  try {
    const response = await fetch(`${baseUrl}/transaction/initialize`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        amount: 1600, // 16 GHS in pesewas (16 * 100)
        currency: 'GHS'
      })
    })
    
    console.log('Response Status:', response.status)
    const data = await response.json()
    console.log('Response:', JSON.stringify(data, null, 2))
    
    if (response.status === 200 && data.status) {
      console.log('✅ GHS transaction initialization successful!')
      console.log('🔗 Checkout URL:', data.data.authorization_url)
    } else {
      console.log('❌ GHS transaction failed')
      if (data.message) {
        console.log('Error:', data.message)
      }
    }
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
  
  // Test 2: Check supported currencies
  console.log('\n🌍 Test 2: Checking supported currencies...')
  try {
    const response = await fetch(`${baseUrl}/country`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    
    if (response.status === 200) {
      const data = await response.json()
      console.log('Supported countries and currencies:')
      data.data.forEach(country => {
        if (country.currency) {
          console.log(`  ${country.name}: ${country.currency.code}`)
        }
      })
    }
  } catch (error) {
    console.log('Could not fetch currency info:', error.message)
  }
}

testGHSTransaction().then(() => {
  console.log('\n✨ Currency test completed!')
}).catch(error => {
  console.error('💥 Test failed:', error)
})