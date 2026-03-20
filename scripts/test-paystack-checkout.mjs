#!/usr/bin/env node

import { config } from 'dotenv'
config()

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET_KEY) {
  console.error('❌ PAYSTACK_SECRET_KEY not found in environment variables')
  process.exit(1)
}

console.log('🔑 Using Paystack Secret Key:', PAYSTACK_SECRET_KEY.substring(0, 10) + '...')

async function testPaystackAPI() {
  const baseUrl = 'https://api.paystack.co'
  
  // Test 1: Create Customer
  console.log('\n📝 Test 1: Creating customer...')
  try {
    const customerResponse = await fetch(`${baseUrl}/customer`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User'
      })
    })
    
    const customerData = await customerResponse.json()
    console.log('Customer Response:', JSON.stringify(customerData, null, 2))
    
    if (customerData.status) {
      console.log('✅ Customer created successfully')
      
      // Test 2: Initialize Transaction
      console.log('\n💳 Test 2: Initializing transaction...')
      const transactionResponse = await fetch(`${baseUrl}/transaction/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: 'test@example.com',
          amount: 100, // $1 in kobo
          currency: 'USD',
          customer: customerData.data.customer_code,
          callback_url: 'http://localhost:3000/account?success=true',
          metadata: {
            plan: 'continent_monthly',
            custom_fields: [
              {
                display_name: "Plan",
                variable_name: "plan",
                value: "continent_monthly"
              }
            ]
          }
        })
      })
      
      const transactionData = await transactionResponse.json()
      console.log('Transaction Response:', JSON.stringify(transactionData, null, 2))
      
      if (transactionData.status) {
        console.log('✅ Transaction initialized successfully')
        console.log('🔗 Checkout URL:', transactionData.data.authorization_url)
      } else {
        console.log('❌ Transaction initialization failed')
      }
    } else {
      console.log('❌ Customer creation failed')
    }
  } catch (error) {
    console.error('❌ API Test failed:', error.message)
  }
  
  // Test 3: Check Plans
  console.log('\n📋 Test 3: Checking available plans...')
  try {
    const plansResponse = await fetch(`${baseUrl}/plan`, {
      headers: {
        'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      }
    })
    
    const plansData = await plansResponse.json()
    console.log('Plans Response:', JSON.stringify(plansData, null, 2))
    
    if (plansData.status && plansData.data.length > 0) {
      console.log('✅ Plans found:')
      plansData.data.forEach(plan => {
        console.log(`  - ${plan.name}: ${plan.amount/100} ${plan.currency} (${plan.interval})`)
      })
    } else {
      console.log('⚠️  No plans found - you may need to create them in Paystack dashboard')
    }
  } catch (error) {
    console.error('❌ Plans check failed:', error.message)
  }
}

console.log('🚀 Testing Paystack API Integration...')
testPaystackAPI().then(() => {
  console.log('\n✨ Test completed!')
}).catch(error => {
  console.error('💥 Test failed:', error)
})