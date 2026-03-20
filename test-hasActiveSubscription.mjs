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

// Simulate the functions from subscription-utils.ts
async function getCurrentSubscription(userId) {
  try {
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, userId))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1)
    
    return subscription.length > 0 ? subscription[0] : null
  } catch (error) {
    console.error('Error fetching current subscription:', error)
    return null
  }
}

function isTrialExpired(trialEndsAt) {
  if (!trialEndsAt) return false
  return new Date() > trialEndsAt
}

function getEffectiveSubscriptionStatus(subscription) {
  if (!subscription) return 'inactive'
  
  if (subscription.status === 'trialing' && subscription.trialEndsAt) {
    if (isTrialExpired(subscription.trialEndsAt)) {
      return 'trial_expired'
    }
  }
  
  if (subscription.status === 'cancelled' && subscription.currentPeriodEnd) {
    if (new Date() > subscription.currentPeriodEnd) {
      return 'expired'
    }
  }
  
  return subscription.status
}

async function hasActiveSubscription(userId) {
  try {
    const subscription = await getCurrentSubscription(userId)
    if (!subscription) return false
    
    const effectiveStatus = getEffectiveSubscriptionStatus(subscription)
    
    // Consider active, trialing, and cancelled (but not expired) as having access
    return ['active', 'trialing', 'cancelled'].includes(effectiveStatus)
  } catch (error) {
    console.warn('Failed to check subscription status:', error)
    return false
  }
}

async function testHasActiveSubscription() {
  try {
    console.log('🧪 Testing hasActiveSubscription function...\n')
    
    // Test with users who have expired trials
    const testUsers = [
      { email: 'blinktechnologies125@gmail.com', name: 'Blink Technologies' },
      { email: 'bienvenuealliance45@gmail.com', name: 'Alliance Bienvenue' },
      { email: 'test-continent@example.com', name: 'Test Continent User' },
      { email: 'bienvenuealliance@gmail.com', name: 'Alliance Code Ed' }
    ]

    for (const testUser of testUsers) {
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, testUser.email))
        .limit(1)

      if (user.length === 0) {
        console.log(`❌ User not found: ${testUser.email}`)
        continue
      }

      const userId = user[0].id
      const subscription = await getCurrentSubscription(userId)
      const hasActive = await hasActiveSubscription(userId)
      
      console.log(`👤 ${testUser.name} (${testUser.email})`)
      
      if (subscription) {
        const effectiveStatus = getEffectiveSubscriptionStatus(subscription)
        const isExpired = subscription.trialEndsAt && isTrialExpired(subscription.trialEndsAt)
        
        console.log(`   Subscription Status: ${subscription.status}`)
        console.log(`   Trial Ends: ${subscription.trialEndsAt?.toLocaleDateString()} ${isExpired ? '(EXPIRED)' : '(ACTIVE)'}`)
        console.log(`   Effective Status: ${effectiveStatus}`)
        console.log(`   hasActiveSubscription(): ${hasActive}`)
        console.log(`   Should redirect from /subscribe: ${hasActive ? 'YES' : 'NO'}`)
        console.log(`   Should show "Subscribe Now": ${!hasActive && effectiveStatus === 'trial_expired' ? 'YES' : 'NO'}`)
      } else {
        console.log(`   No subscription`)
        console.log(`   hasActiveSubscription(): ${hasActive}`)
        console.log(`   Should redirect from /subscribe: ${hasActive ? 'YES' : 'NO'}`)
      }
      
      console.log('')
    }

    console.log('✅ hasActiveSubscription test completed!')

  } catch (error) {
    console.error('❌ Error testing hasActiveSubscription:', error)
  } finally {
    await client.end()
  }
}

testHasActiveSubscription()