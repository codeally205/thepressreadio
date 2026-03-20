import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function checkAndEndTrials() {
  console.log('🔍 Checking Trial Subscriptions\n')
  console.log('='.repeat(70))
  
  // Find all trialing subscriptions
  const trialingSubscriptions = await sql`
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
    WHERE s.status = 'trialing'
    ORDER BY s.created_at DESC
  `
  
  console.log(`\n📊 Found ${trialingSubscriptions.length} trialing subscription(s):\n`)
  
  if (trialingSubscriptions.length === 0) {
    console.log('No trialing subscriptions found.')
    return
  }
  
  trialingSubscriptions.forEach((sub, i) => {
    const now = new Date()
    const trialEnds = new Date(sub.trial_ends_at)
    const isExpired = now > trialEnds
    const daysLeft = Math.ceil((trialEnds - now) / (1000 * 60 * 60 * 24))
    
    console.log(`${i + 1}. ${sub.email} (${sub.name})`)
    console.log(`   Subscription ID: ${sub.id}`)
    console.log(`   Plan: ${sub.plan}`)
    console.log(`   Processor: ${sub.payment_processor}`)
    console.log(`   Trial ends: ${sub.trial_ends_at}`)
    console.log(`   Status: ${isExpired ? '❌ EXPIRED' : `✅ Active (${daysLeft} days left)`}`)
    console.log(`   Created: ${sub.created_at}`)
    console.log('')
  })
  
  console.log('='.repeat(70))
  console.log('\n🎯 Options to End Trials:\n')
  console.log('1. End specific trial by email')
  console.log('2. End all trials')
  console.log('3. End first 2 trials')
  console.log('')
  
  // For testing, let's end the first 2 trials
  console.log('📝 Ending first 2 trials for testing...\n')
  
  const trialsToEnd = trialingSubscriptions.slice(0, 2)
  
  if (trialsToEnd.length === 0) {
    console.log('No trials to end.')
    return
  }
  
  for (const trial of trialsToEnd) {
    console.log(`Ending trial for: ${trial.email}`)
    console.log(`   Subscription ID: ${trial.id}`)
    
    // Update subscription to expired status
    await sql`
      UPDATE subscriptions
      SET 
        status = 'trial_expired',
        trial_ends_at = NOW() - INTERVAL '1 day',
        updated_at = NOW()
      WHERE id = ${trial.id}
    `
    
    console.log(`   ✅ Trial ended - Status changed to 'trial_expired'`)
    console.log(`   ✅ Trial end date set to yesterday`)
    console.log('')
  }
  
  console.log('='.repeat(70))
  console.log('SUMMARY:')
  console.log('='.repeat(70))
  console.log(`✅ Ended ${trialsToEnd.length} trial(s)`)
  console.log('\nThese users can now:')
  console.log('1. Make a real payment (no trial offered)')
  console.log('2. Subscribe with immediate payment')
  console.log('3. Test the full payment flow')
  console.log('\nTo verify, check the account page for these users.')
}

checkAndEndTrials().catch(console.error)
