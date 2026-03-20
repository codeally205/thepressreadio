import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function endAllSubscriptions() {
  console.log('🔚 Ending All Active Subscriptions\n')
  console.log('='.repeat(70))
  
  // Find all active or trialing subscriptions
  const activeSubscriptions = await sql`
    SELECT 
      s.id,
      s.user_id,
      s.plan,
      s.status,
      s.trial_ends_at,
      s.current_period_end,
      s.payment_processor,
      u.email,
      u.name
    FROM subscriptions s
    JOIN "user" u ON s.user_id = u.id
    WHERE s.status IN ('active', 'trialing', 'cancelled')
    ORDER BY s.created_at DESC
  `
  
  console.log(`\n📊 Found ${activeSubscriptions.length} subscription(s) to end:\n`)
  
  if (activeSubscriptions.length === 0) {
    console.log('No active subscriptions found.')
    return
  }
  
  activeSubscriptions.forEach((sub, i) => {
    console.log(`${i + 1}. ${sub.email} (${sub.name})`)
    console.log(`   Subscription ID: ${sub.id}`)
    console.log(`   Plan: ${sub.plan}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Processor: ${sub.payment_processor}`)
    console.log('')
  })
  
  console.log('='.repeat(70))
  console.log('\n🔥 Ending all subscriptions...\n')
  
  for (const sub of activeSubscriptions) {
    console.log(`Ending subscription for: ${sub.email}`)
    console.log(`   Subscription ID: ${sub.id}`)
    
    // End the subscription by setting status to expired and dates to past
    await sql`
      UPDATE subscriptions
      SET 
        status = 'expired',
        trial_ends_at = NOW() - INTERVAL '30 days',
        current_period_end = NOW() - INTERVAL '1 day',
        cancelled_at = NOW(),
        updated_at = NOW()
      WHERE id = ${sub.id}
    `
    
    console.log(`   ✅ Subscription ended`)
    console.log(`   ✅ Status: ${sub.status} → expired`)
    console.log(`   ✅ Period end: Set to yesterday`)
    console.log(`   ✅ Trial end: Set to 30 days ago`)
    console.log('')
  }
  
  console.log('='.repeat(70))
  console.log('\n📋 Verification - Checking final status...\n')
  
  const verifySubscriptions = await sql`
    SELECT 
      u.email,
      s.plan,
      s.status,
      s.trial_ends_at,
      s.current_period_end
    FROM subscriptions s
    JOIN "user" u ON s.user_id = u.id
    WHERE s.id = ANY(${activeSubscriptions.map(s => s.id)})
    ORDER BY u.email
  `
  
  verifySubscriptions.forEach((sub, i) => {
    console.log(`${i + 1}. ${sub.email}`)
    console.log(`   Plan: ${sub.plan}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Period ended: ${sub.current_period_end}`)
    console.log(`   Trial ended: ${sub.trial_ends_at}`)
    console.log('')
  })
  
  console.log('='.repeat(70))
  console.log('✅ ALL SUBSCRIPTIONS ENDED\n')
  console.log('What this means:')
  console.log('1. All subscriptions are now "expired"')
  console.log('2. Users have NO active access')
  console.log('3. Users can subscribe again (but NO trial - they already had one)')
  console.log('4. Button will show "Subscribe Now"')
  console.log('5. Payment will be required immediately')
  console.log('6. New subscription will start as "active"')
  console.log('\nTo test:')
  console.log('1. Sign in with any of the above emails')
  console.log('2. Go to /subscribe')
  console.log('3. Button should show "Subscribe Now" (not "Start Free Trial")')
  console.log('4. Click subscribe → Goes to Paystack payment')
  console.log('5. Complete payment')
  console.log('6. New subscription created as "active"')
  console.log('\nNote: Users still have subscription history, so they are NOT eligible for trial')
}

endAllSubscriptions().catch(console.error)
