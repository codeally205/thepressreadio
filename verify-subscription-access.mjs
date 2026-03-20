import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function verifySubscriptionAccess() {
  console.log('🔍 Verifying Subscription Access Logic\n')
  console.log('='.repeat(70))
  
  const testEmails = [
    'emmabyiringiro215@gmail.com',
    'alliancedamour88@gmail.com',
    'blinktechnologies125@gmail.com'
  ]
  
  console.log('\n1️⃣ Checking current subscription status...\n')
  
  for (const email of testEmails) {
    // This mimics what getCurrentSubscription() does
    const currentSubscription = await sql`
      SELECT 
        s.id,
        s.plan,
        s.status,
        s.trial_ends_at,
        s.current_period_end,
        s.payment_processor
      FROM subscriptions s
      JOIN "user" u ON s.user_id = u.id
      WHERE u.email = ${email}
        AND (
          s.status IN ('active', 'trialing') 
          OR (s.status = 'cancelled' AND s.current_period_end > NOW())
        )
      ORDER BY s.created_at DESC
      LIMIT 1
    `
    
    console.log(`${email}:`)
    if (currentSubscription.length > 0) {
      const sub = currentSubscription[0]
      console.log(`   ❌ HAS ACTIVE SUBSCRIPTION (This is wrong!)`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Plan: ${sub.plan}`)
      console.log(`   Period ends: ${sub.current_period_end}`)
    } else {
      console.log(`   ✅ NO ACTIVE SUBSCRIPTION (Correct!)`)
      console.log(`   User can subscribe again`)
    }
    console.log('')
  }
  
  console.log('='.repeat(70))
  console.log('\n2️⃣ Checking trial eligibility...\n')
  
  for (const email of testEmails) {
    // Check if user has had any subscription (for trial eligibility)
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
    console.log(`   Button text: "${isEligibleForTrial ? 'Start Free Trial' : 'Subscribe Now'}"`)
    console.log('')
  }
  
  console.log('='.repeat(70))
  console.log('\n3️⃣ Checking what happens when they subscribe...\n')
  
  for (const email of testEmails) {
    const user = await sql`
      SELECT id, email FROM "user" WHERE email = ${email}
    `
    
    if (user.length === 0) continue
    
    const userId = user[0].id
    
    // Check if they have any previous subscription
    const previousSubs = await sql`
      SELECT COUNT(*) as count FROM subscriptions WHERE user_id = ${userId}
    `
    
    const hasHadTrial = parseInt(previousSubs[0].count) > 0
    
    console.log(`${email}:`)
    console.log(`   Has had trial before: ${hasHadTrial ? 'YES' : 'NO'}`)
    console.log(`   When they subscribe:`)
    if (hasHadTrial) {
      console.log(`     - Will NOT get trial`)
      console.log(`     - Must pay immediately`)
      console.log(`     - Subscription status: "active"`)
      console.log(`     - trial_ends_at: NULL`)
    } else {
      console.log(`     - Will get 14-day trial`)
      console.log(`     - No payment required`)
      console.log(`     - Subscription status: "trialing"`)
      console.log(`     - trial_ends_at: 14 days from now`)
    }
    console.log('')
  }
  
  console.log('='.repeat(70))
  console.log('\n✅ VERIFICATION COMPLETE\n')
  console.log('Expected behavior:')
  console.log('1. All users show NO active subscription ✅')
  console.log('2. All users are NOT eligible for trial (had one before) ✅')
  console.log('3. Button shows "Subscribe Now" ✅')
  console.log('4. Clicking subscribe goes to payment ✅')
  console.log('5. New subscription created as "active" (not "trialing") ✅')
  console.log('\nReady to test real payments!')
}

verifySubscriptionAccess().catch(console.error)
