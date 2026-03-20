import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function manuallyCreateStripeSubscription() {
  console.log('🔧 Manually Creating Stripe Subscription\n')
  console.log('='.repeat(70))
  console.log('\nThis script creates a subscription for a user who completed')
  console.log('Stripe payment but webhook didn\'t fire (common in localhost).\n')
  
  const email = 'emmabyiringiro215@gmail.com'
  const plan = 'diaspora_monthly' // Change if needed
  
  console.log(`Email: ${email}`)
  console.log(`Plan: ${plan}\n`)
  
  // Get user
  const user = await sql`
    SELECT id, email, name FROM "user" WHERE email = ${email}
  `
  
  if (user.length === 0) {
    console.log('❌ User not found')
    return
  }
  
  const userId = user[0].id
  console.log(`✅ User found: ${user[0].name} (${userId})\n`)
  
  // Check if they already have an active subscription
  const existingActive = await sql`
    SELECT id, plan, status, current_period_end
    FROM subscriptions
    WHERE user_id = ${userId}
      AND status IN ('active', 'trialing')
      AND current_period_end > NOW()
  `
  
  if (existingActive.length > 0) {
    console.log('⚠️  User already has an active subscription:')
    console.log(`   Plan: ${existingActive[0].plan}`)
    console.log(`   Status: ${existingActive[0].status}`)
    console.log(`   Ends: ${existingActive[0].current_period_end}`)
    console.log('\nDo you want to create another one? (This will give them 2 subscriptions)')
    return
  }
  
  // Create new subscription
  const now = new Date()
  const periodEnd = new Date(now)
  periodEnd.setMonth(periodEnd.getMonth() + 1) // 1 month from now
  
  console.log('Creating new subscription...\n')
  
  const newSubscription = await sql`
    INSERT INTO subscriptions (
      user_id,
      plan,
      status,
      trial_ends_at,
      current_period_start,
      current_period_end,
      payment_processor,
      stripe_subscription_id,
      created_at,
      updated_at
    ) VALUES (
      ${userId},
      ${plan},
      'active',
      NULL,
      ${now},
      ${periodEnd},
      'stripe',
      ${'manual_' + Date.now()},
      ${now},
      ${now}
    )
    RETURNING id, plan, status, current_period_end
  `
  
  console.log('✅ Subscription created successfully!\n')
  console.log('Details:')
  console.log(`   Subscription ID: ${newSubscription[0].id}`)
  console.log(`   Plan: ${newSubscription[0].plan}`)
  console.log(`   Status: ${newSubscription[0].status}`)
  console.log(`   Period ends: ${newSubscription[0].current_period_end}`)
  
  console.log('\n' + '='.repeat(70))
  console.log('✅ COMPLETE\n')
  console.log('The user now has an active subscription.')
  console.log('They can access premium content immediately.')
  console.log('\nRefresh the account page to see the active subscription.')
}

manuallyCreateStripeSubscription().catch(console.error)
