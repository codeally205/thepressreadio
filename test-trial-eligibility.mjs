#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, desc } from 'drizzle-orm'
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import dotenv from 'dotenv'

// Define schemas inline
const users = pgTable('user', {
  id: uuid('id').primaryKey().defaultRandom(),
  name: text('name'),
  email: text('email').notNull().unique(),
  emailVerified: timestamp('emailVerified', { mode: 'date' }),
  image: text('image'),
  avatarUrl: text('avatar_url'),
  authProvider: text('auth_provider').notNull().default('email'),
  passwordHash: text('password_hash'),
  role: text('role').default('viewer'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

const subscriptions = pgTable('subscriptions', {
  id: uuid('id').primaryKey().defaultRandom(),
  userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  plan: text('plan').notNull(),
  status: text('status').notNull(),
  trialEndsAt: timestamp('trial_ends_at', { withTimezone: true }),
  currentPeriodStart: timestamp('current_period_start', { withTimezone: true }).notNull(),
  currentPeriodEnd: timestamp('current_period_end', { withTimezone: true }).notNull(),
  cancelAtPeriodEnd: boolean('cancel_at_period_end').notNull().default(false),
  cancelledAt: timestamp('cancelled_at', { withTimezone: true }),
  stripeSubscriptionId: text('stripe_subscription_id').unique(),
  stripeCustomerId: text('stripe_customer_id'),
  paystackSubscriptionCode: text('paystack_subscription_code').unique(),
  paystackCustomerCode: text('paystack_customer_code'),
  paymentProcessor: text('payment_processor').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
})

// Load environment variables
dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

// Simulate the getUserTrialInfo function
async function getUserTrialInfo(userId) {
  const existingSubscription = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1)
  
  const hasHadTrial = existingSubscription.length > 0
  const trialEndsAt = hasHadTrial ? null : (() => {
    const date = new Date()
    date.setDate(date.getDate() + 14)
    return date
  })()
  const status = hasHadTrial ? 'active' : 'trialing'
  
  return {
    hasHadTrial,
    trialEndsAt,
    status,
    isEligibleForTrial: !hasHadTrial
  }
}

async function testTrialEligibility() {
  try {
    console.log('🧪 Testing Trial Eligibility Logic...\n')
    
    // Get all users and check their trial eligibility
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.createdAt))
      .limit(10)

    console.log('📋 Trial Eligibility Status for Recent Users:\n')

    for (const user of allUsers) {
      const trialInfo = await getUserTrialInfo(user.id)
      
      // Get current subscription details
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)

      console.log(`👤 ${user.name || 'No name'} (${user.email})`)
      console.log(`   User ID: ${user.id}`)
      console.log(`   Eligible for trial: ${trialInfo.isEligibleForTrial ? '✅ YES' : '❌ NO'}`)
      console.log(`   Has had trial: ${trialInfo.hasHadTrial ? 'Yes' : 'No'}`)
      
      if (subscription.length > 0) {
        const sub = subscription[0]
        console.log(`   Current subscription: ${sub.status} (${sub.plan})`)
        if (sub.trialEndsAt) {
          const isExpired = new Date() > sub.trialEndsAt
          console.log(`   Trial ends: ${sub.trialEndsAt.toLocaleDateString()} ${isExpired ? '(EXPIRED)' : '(ACTIVE)'}`)
        }
      } else {
        console.log(`   Current subscription: None`)
      }
      
      // Determine what button should show
      let buttonText = 'Start Free Trial'
      if (subscription.length > 0) {
        const sub = subscription[0]
        if (sub.status === 'active' || sub.status === 'trialing') {
          buttonText = 'Manage Subscription'
        }
      } else if (!trialInfo.isEligibleForTrial) {
        buttonText = 'Subscribe Now'
      }
      
      console.log(`   Button should show: "${buttonText}"`)
      console.log('')
    }

    console.log('✅ Trial eligibility test completed!')

  } catch (error) {
    console.error('❌ Error testing trial eligibility:', error)
  } finally {
    await client.end()
  }
}

testTrialEligibility()