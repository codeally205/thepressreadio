import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function endSpecificTrials() {
  console.log('🔍 Managing Trial Subscriptions\n')
  console.log('='.repeat(70))
  
  // Get all subscriptions (not just trialing)
  const allSubscriptions = await sql`
    SELECT 
      s.id,
      s.user_id,
      s.plan,
      s.status,
      s.trial_ends_at,
      s.current_period_end,
      s.payment_processor,
      s.created_at,
      u.email,
      u.name
    FROM subscriptions s
    JOIN "user" u ON s.user_id = u.id
    ORDER BY s.created_at DESC
  `
  
  console.log(`\n📊 All Subscriptions (${allSubscriptions.length} total):\n`)
  
  const statusGroups = {
    trialing: [],
    active: [],
    trial_expired: [],
    cancelled: [],
    other: []
  }
  
  allSubscriptions.forEach(sub => {
    const status = sub.status
    if (statusGroups[status]) {
      statusGroups[status].push(sub)
    } else {
      statusGroups.other.push(sub)
    }
  })
  
  console.log('Status Breakdown:')
  console.log(`  Trialing: ${statusGroups.trialing.length}`)
  console.log(`  Active: ${statusGroups.active.length}`)
  console.log(`  Trial Expired: ${statusGroups.trial_expired.length}`)
  console.log(`  Cancelled: ${statusGroups.cancelled.length}`)
  console.log(`  Other: ${statusGroups.other.length}`)
  console.log('')
  
  // Show trialing subscriptions
  if (statusGroups.trialing.length > 0) {
    console.log('🔵 TRIALING Subscriptions:\n')
    statusGroups.trialing.forEach((sub, i) => {
      const now = new Date()
      const trialEnds = new Date(sub.trial_ends_at)
      const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24))
      
      console.log(`${i + 1}. ${sub.email}`)
      console.log(`   Plan: ${sub.plan} | Processor: ${sub.payment_processor}`)
      console.log(`   Trial ends: ${sub.trial_ends_at} (${daysLeft} days left)`)
      console.log('')
    })
  }
  
  // Show active subscriptions
  if (statusGroups.active.length > 0) {
    console.log('🟢 ACTIVE Subscriptions:\n')
    statusGroups.active.forEach((sub, i) => {
      console.log(`${i + 1}. ${sub.email}`)
      console.log(`   Plan: ${sub.plan} | Processor: ${sub.payment_processor}`)
      console.log(`   Period ends: ${sub.current_period_end}`)
      console.log('')
    })
  }
  
  // Show expired trials
  if (statusGroups.trial_expired.length > 0) {
    console.log('🔴 TRIAL EXPIRED Subscriptions:\n')
    statusGroups.trial_expired.forEach((sub, i) => {
      console.log(`${i + 1}. ${sub.email}`)
      console.log(`   Plan: ${sub.plan} | Processor: ${sub.payment_processor}`)
      console.log(`   Trial ended: ${sub.trial_ends_at}`)
      console.log('')
    })
  }
  
  console.log('='.repeat(70))
  console.log('\n🎯 ACTION: Ending trials for testing\n')
  
  // Emails to end trials for
  const emailsToEndTrial = [
    'emmabyiringiro215@gmail.com',
    'alliancedamour88@gmail.com'
  ]
  
  console.log('Target emails:')
  emailsToEndTrial.forEach(email => console.log(`  - ${email}`))
  console.log('')
  
  for (const email of emailsToEndTrial) {
    // Find trialing subscription for this email
    const subscription = await sql`
      SELECT s.id, s.status, s.trial_ends_at, u.email
      FROM subscriptions s
      JOIN "user" u ON s.user_id = u.id
      WHERE u.email = ${email}
        AND s.status IN ('trialing', 'active')
      ORDER BY s.created_at DESC
      LIMIT 1
    `
    
    if (subscription.length === 0) {
      console.log(`⚠️  ${email} - No active/trialing subscription found`)
      continue
    }
    
    const sub = subscription[0]
    
    if (sub.status === 'trialing') {
      console.log(`✅ ${email} - Ending trial`)
      
      // End the trial
      await sql`
        UPDATE subscriptions
        SET 
          status = 'trial_expired',
          trial_ends_at = NOW() - INTERVAL '1 day',
          updated_at = NOW()
        WHERE id = ${sub.id}
      `
      
      console.log(`   Status changed: trialing → trial_expired`)
    } else if (sub.status === 'active') {
      console.log(`ℹ️  ${email} - Already has active subscription (not trialing)`)
      
      // Mark as if they had a trial before
      await sql`
        UPDATE subscriptions
        SET 
          trial_ends_at = NOW() - INTERVAL '30 days',
          updated_at = NOW()
        WHERE id = ${sub.id}
      `
      
      console.log(`   Trial date set to past (will not be eligible for new trial)`)
    }
    console.log('')
  }
  
  console.log('='.repeat(70))
  console.log('VERIFICATION:\n')
  
  // Verify the changes
  for (const email of emailsToEndTrial) {
    const subscription = await sql`
      SELECT s.id, s.status, s.trial_ends_at, s.plan
      FROM subscriptions s
      JOIN "user" u ON s.user_id = u.id
      WHERE u.email = ${email}
      ORDER BY s.created_at DESC
      LIMIT 1
    `
    
    if (subscription.length > 0) {
      const sub = subscription[0]
      console.log(`${email}:`)
      console.log(`  Status: ${sub.status}`)
      console.log(`  Trial ends: ${sub.trial_ends_at}`)
      console.log(`  Plan: ${sub.plan}`)
      console.log('')
    }
  }
  
  console.log('='.repeat(70))
  console.log('✅ COMPLETE\n')
  console.log('These users can now test real payments:')
  console.log('1. They will NOT be offered a trial')
  console.log('2. Payment will be required immediately')
  console.log('3. Subscription will be created as "active" (not trialing)')
  console.log('\nTo test:')
  console.log('1. Sign in with one of these emails')
  console.log('2. Go to /subscribe')
  console.log('3. Click subscribe - should go directly to payment')
  console.log('4. Complete payment')
  console.log('5. Verify subscription is created as "active"')
}

endSpecificTrials().catch(console.error)
