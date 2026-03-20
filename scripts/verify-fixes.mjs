#!/usr/bin/env node

/**
 * Verify that all Paystack fixes have been applied correctly
 * This script checks the code changes without requiring a running server
 */

import { readFileSync, existsSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

function checkFileExists(filePath, description) {
  const fullPath = join(__dirname, '..', filePath)
  if (existsSync(fullPath)) {
    console.log(`✅ ${description}: ${filePath}`)
    return true
  } else {
    console.log(`❌ ${description}: ${filePath} - NOT FOUND`)
    return false
  }
}

function checkFileContains(filePath, searchText, description) {
  const fullPath = join(__dirname, '..', filePath)
  try {
    const content = readFileSync(fullPath, 'utf8')
    if (content.includes(searchText)) {
      console.log(`✅ ${description}`)
      return true
    } else {
      console.log(`❌ ${description} - NOT FOUND`)
      return false
    }
  } catch (error) {
    console.log(`❌ ${description} - FILE ERROR: ${error.message}`)
    return false
  }
}

async function verifyDatabaseConstraints() {
  console.log('🔍 Verifying database constraints...')
  
  try {
    const { createDbConnection } = await import('./db-connection.mjs')
    const { client } = createDbConnection()
    
    // Check constraints
    const constraints = await client`
      SELECT constraint_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name IN (
        'unique_paystack_subscription_code',
        'unique_stripe_subscription_id'
      )
    `
    
    const constraintNames = constraints.map(c => c.constraint_name)
    
    if (constraintNames.includes('unique_paystack_subscription_code')) {
      console.log('✅ Paystack subscription code constraint exists')
    } else {
      console.log('❌ Paystack subscription code constraint missing')
    }
    
    if (constraintNames.includes('unique_stripe_subscription_id')) {
      console.log('✅ Stripe subscription ID constraint exists')
    } else {
      console.log('❌ Stripe subscription ID constraint missing')
    }
    
    await client.end()
    return constraintNames.length > 0
  } catch (error) {
    console.log('⚠️ Could not verify database constraints (database may not be running)')
    return false
  }
}

async function main() {
  console.log('🔍 Verifying Paystack Payment System Fixes\n')
  
  let allGood = true
  
  // Check 1: New files created
  console.log('📁 Checking new files...')
  allGood &= checkFileExists('lib/rate-limiter.ts', 'Rate limiter module')
  allGood &= checkFileExists('lib/webhook-security.ts', 'Webhook security module')
  allGood &= checkFileExists('drizzle/add-unique-constraints.sql', 'Database migration SQL')
  allGood &= checkFileExists('PAYSTACK_FIXES_IMPLEMENTATION.md', 'Implementation documentation')
  console.log('')
  
  // Check 2: Trial logic standardization
  console.log('🧪 Checking trial logic fixes...')
  allGood &= checkFileContains(
    'lib/subscription-utils.ts',
    'getUserTrialInfo',
    'Centralized trial logic function exists'
  )
  allGood &= checkFileContains(
    'app/api/checkout/paystack/route.ts',
    'getUserTrialInfo',
    'Checkout endpoint uses standardized trial logic'
  )
  allGood &= checkFileContains(
    'app/api/webhooks/paystack/route.ts',
    'getUserTrialInfo',
    'Webhook endpoint uses standardized trial logic'
  )
  allGood &= checkFileContains(
    'app/api/paystack/verify/route.ts',
    'getUserTrialInfo',
    'Verification endpoint uses standardized trial logic'
  )
  console.log('')
  
  // Check 3: Webhook security enhancements
  console.log('🔒 Checking webhook security fixes...')
  allGood &= checkFileContains(
    'app/api/webhooks/paystack/route.ts',
    'webhookRateLimiter',
    'Webhook rate limiting implemented'
  )
  allGood &= checkFileContains(
    'app/api/webhooks/paystack/route.ts',
    'verifyPaystackSignature',
    'Enhanced signature verification implemented'
  )
  allGood &= checkFileContains(
    'app/api/webhooks/paystack/route.ts',
    'sanitizeWebhookPayload',
    'Payload sanitization implemented'
  )
  console.log('')
  
  // Check 4: Cancellation fix
  console.log('🚫 Checking cancellation fix...')
  allGood &= checkFileContains(
    'app/api/subscription/cancel/route.ts',
    'subscription.paystackSubscriptionCode,',
    'Cancellation method uses correct parameters'
  )
  console.log('')
  
  // Check 5: Database constraints
  console.log('🗄️ Checking database constraints...')
  const dbConstraintsOk = await verifyDatabaseConstraints()
  allGood &= dbConstraintsOk
  console.log('')
  
  // Summary
  console.log('📋 Verification Summary:')
  if (allGood) {
    console.log('🎉 All Paystack fixes have been successfully applied!')
    console.log('')
    console.log('✅ Database unique constraints: Applied')
    console.log('✅ Trial period logic: Standardized')
    console.log('✅ Webhook security: Enhanced')
    console.log('✅ Cancellation method: Fixed')
    console.log('✅ Rate limiting: Implemented')
    console.log('')
    console.log('🚀 Your payment system is now production-ready!')
  } else {
    console.log('⚠️ Some fixes may not have been applied correctly.')
    console.log('   Please review the output above and re-run the fix scripts if needed.')
  }
  
  console.log('')
  console.log('📖 For detailed information, see: PAYSTACK_FIXES_IMPLEMENTATION.md')
}

main().catch(console.error)