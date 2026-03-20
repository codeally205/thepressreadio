import { db } from './lib/db/index.ts'
import { subscriptions, users } from './lib/db/schema.ts'
import { eq } from 'drizzle-orm'
import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2024-11-20.acacia'
})

const email = process.argv[2] || 'bienvenuealliance45@gmail.com'

console.log('🔍 Syncing Stripe subscription for:', email)

// Find user in database
const user = await db.query.users.findFirst({
  where: eq(users.email, email),
})

if (!user) {
  console.log('❌ User not found in database')
  process.exit(1)
}

console.log('✅ User found:', {
  id: user.id,
  email: user.email,
  name: user.name
})

// Find Stripe customer
console.log('\n🔍 Looking for Stripe customer...')
const customers = await stripe.customers.list({
  email: email,
  limit: 1
})

if (customers.data.length === 0) {
  console.log('❌ No Stripe customer found for this email')
  process.exit(1)
}

const customer = customers.data[0]
console.log('✅ Stripe customer found:', customer.id)

// Get customer's subscriptions
console.log('\n🔍 Fetching Stripe subscriptions...')
const stripeSubscriptions = await stripe.subscriptions.list({
  customer: customer.id,
  limit: 10
})

if (stripeSubscriptions.data.length === 0) {
  console.log('❌ No Stripe subscriptions found for this customer')
  process.exit(1)
}

console.log(`✅ Found ${stripeSubscriptions.data.length} Stripe subscription(s):\n`)

for (const stripeSub of stripeSubscriptions.data) {
  console.log('Stripe Subscription:', {
    id: stripeSub.id,
    status: stripeSub.status,
    plan: stripeSub.items.data[0]?.price.id,
    current_period_start: new Date(stripeSub.current_period_start * 1000).toISOString(),
    current_period_end: new Date(stripeSub.current_period_end * 1000).toISOString(),
    trial_end: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000).toISOString() : null,
    metadata: stripeSub.metadata
  })

  // Check if subscription exists in database
  const existingSub = await db.query.subscriptions.findFirst({
    where: eq(subscriptions.stripeSubscriptionId, stripeSub.id)
  })

  if (existingSub) {
    console.log('  ℹ️  Subscription already exists in database, updating...')
    
    await db.update(subscriptions)
      .set({
        status: stripeSub.status,
        currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
        currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
        trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, existingSub.id))
    
    console.log('  ✅ Updated subscription in database')
  } else {
    console.log('  ℹ️  Creating new subscription in database...')
    
    const plan = stripeSub.metadata.plan || 'diaspora_monthly'
    
    await db.insert(subscriptions).values({
      userId: user.id,
      plan: plan,
      status: stripeSub.status,
      trialEndsAt: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
      currentPeriodStart: new Date(stripeSub.current_period_start * 1000),
      currentPeriodEnd: new Date(stripeSub.current_period_end * 1000),
      stripeSubscriptionId: stripeSub.id,
      stripeCustomerId: customer.id,
      paymentProcessor: 'stripe'
    })
    
    console.log('  ✅ Created subscription in database')
  }
  
  console.log('')
}

console.log('✅ Sync complete!')
process.exit(0)
