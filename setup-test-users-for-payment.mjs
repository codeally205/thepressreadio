import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function setupTestUsersForPayment() {
  console.log('🔧 Setting Up Test Users for Real Payment Testing\n')
  console.log('='.repeat(70))
  
  // Strategy: Cancel existing subscriptions so users can subscribe again
  const testEmails = [
    'emmabyiringiro215@gmail.com',
    'blinktechnologies125@gmail.com'
  ]
  
  console.log('\n1️⃣ Finding users and their subscriptions...\n')
  
  for (const email of testEmails) {
    const userSubs = await sql`
      SELECT 
        u.id as user_id,
        u.email,
        u.name,
        s.id as subscription_id,
        s.plan,
        s.status,
        s.trial_ends_at,
        s.payment_processor
      FROM "user" u
      LEFT JOIN subscriptions s ON u.id = s.user_id
      WHERE u.email = ${email}
      ORDER BY s.created_at DESC
      LIMIT 1
    `
    
    if (userSubs.length === 0) {
      console.log(`❌ ${email} - User not found`)
      continue
    }
    
    const user = userSubs[0]
    console.log(`📧 ${email}`)
    console.log(`   User ID: ${user.user_id}`)
    
    if (user.subscription_id) {
      console.log(`   Current subscription:`)
      console.log(`     - ID: ${user.subscription_id}`)
      console.log(`     - Plan: ${user.plan}`)
      console.log(`     - Status: ${user.status}`)
      console.log(`     - Processor: ${user.payment_processor}`)
      
      // Cancel the subscription
      if (user.status !== 'cancelled') {
        await sql`
          UPDATE subscriptions
          SET 
            status = 'cancelled',
            cancelled_at = NOW(),
            updated_at = NOW()
          WHERE id = ${user.subscription_id}
        `
        console.log(`   ✅ Subscription cancelled`)
      } else {
        console.log(`   ℹ️  Already cancelled`)
      }
      
      // Set trial date to past so they're not eligible for trial
      await sql`
        UPDATE subscriptions
        SET 
          trial_ends_at = NOW() - INTERVAL '30 days',
          updated_at = NOW()
        WHERE id = ${user.subscription_id}
      `
      console.log(`   ✅ Trial eligibility removed (had trial in past)`)
      
    } else {
      console.log(`   ℹ️  No subscription found - user is ready for first subscription`)
    }
    console.log('')
  }
  
  console.log('='.repeat(70))
  console.log('\n2️⃣ Verification - Checking trial eligibility...\n')
  
  for (const email of testEmails) {
    // Check if user has had any subscription
    const hasHadSubscription = await sql`
      SELECT COUNT(*) as count
      FROM subscriptions s
      JOIN "user" u ON s.user_id = u.id
      WHERE u.email = ${email}
    `
    
    const count = parseInt(hasHadSubscription[0].count)
    const isEligibleForTrial = count === 0
    
    console.log(`${email}:`)
    console.log(`   Previous subscriptions: ${count}`)
    console.log(`   Eligible for trial: ${isEligibleForTrial ? '✅ YES' : '❌ NO'}`)
    console.log(`   Button should show: "${isEligibleForTrial ? 'Start Free Trial' : 'Subscribe Now'}"`)
    console.log('')
  }
  
  console.log('='.repeat(70))
  console.log('\n✅ SETUP COMPLETE\n')
  console.log('Test Scenario:')
  console.log('1. Sign in with one of these emails')
  console.log('2. Go to /subscribe or /pricing')
  console.log('3. Button should show "Subscribe Now" (not "Start Free Trial")')
  console.log('4. Click subscribe')
  console.log('5. Should go directly to Paystack payment (no trial created)')
  console.log('6. Complete payment')
  console.log('7. Subscription should be created as "active" (not "trialing")')
  console.log('\nExpected behavior:')
  console.log('- No trial offered (they already had one)')
  console.log('- Payment required immediately')
  console.log('- Subscription starts as "active"')
}

setupTestUsersForPayment().catch(console.error)
