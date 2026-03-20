import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const sql = postgres(process.env.DATABASE_URL)

const email = 'emmabyiringiro215@gmail.com'
const plan = 'continent_monthly'
const reference = 'pn76048xb5'

console.log('Creating subscription for payment:', reference)

// Get user
const users = await sql`
  SELECT id FROM "user" WHERE email = ${email}
`

if (users.length === 0) {
  console.log('❌ User not found')
  await sql.end()
  process.exit(1)
}

const userId = users[0].id
console.log('User ID:', userId)

// Check if subscription already exists
const existing = await sql`
  SELECT id FROM subscriptions 
  WHERE user_id = ${userId} 
  AND payment_processor = 'paystack'
`

if (existing.length > 0) {
  console.log('⚠️  Subscription already exists, updating to active...')
  
  await sql`
    UPDATE subscriptions
    SET status = 'active',
        payment_reference = ${reference},
        updated_at = NOW()
    WHERE id = ${existing[0].id}
  `
  
  console.log('✅ Subscription updated to active')
} else {
  console.log('Creating new subscription...')
  
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + 14)
  
  const periodEnd = new Date()
  periodEnd.setMonth(periodEnd.getMonth() + 1)
  
  const result = await sql`
    INSERT INTO subscriptions (
      user_id, plan, status, trial_ends_at,
      current_period_start, current_period_end,
      paystack_customer_code, payment_processor, payment_reference
    ) VALUES (
      ${userId}, ${plan}, 'trialing', ${trialEndsAt},
      NOW(), ${periodEnd},
      'CUS_3z8ydnby7kx9azu', 'paystack', ${reference}
    )
    RETURNING id, status, plan
  `
  
  console.log('✅ Subscription created:')
  console.log(result[0])
}

await sql.end()
console.log('\n✅ Done! User can now access premium content.')
console.log('Log in with:', email)
