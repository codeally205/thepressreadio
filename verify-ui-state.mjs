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

// Simulate the UI logic
function getEffectiveSubscriptionStatus(subscription) {
  if (!subscription) return 'inactive'
  
  if (subscription.status === 'trialing' && subscription.trialEndsAt) {
    if (new Date() > subscription.trialEndsAt) {
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

function getButtonText(effectiveStatus, hasHadTrial, isEligibleForTrial) {
  // If user has active subscription, show manage subscription
  if (effectiveStatus === 'active' || effectiveStatus === 'trialing') {
    return 'Manage Subscription'
  }
  
  // If trial expired, show subscribe now
  if (effectiveStatus === 'trial_expired') {
    return 'Subscribe Now'
  }
  
  // If user is eligible for trial, show start free trial
  if (isEligibleForTrial) {
    return 'Start Free Trial'
  }
  
  // If user had trial before, show subscribe now
  return 'Subscribe Now'
}

async function verifyUIState() {
  try {
    console.log('🖥️  Verifying UI state for all users...\n')
    
    // Get all users and their subscriptions
    const allUsers = await db
      .select({
        id: users.id,
        email: users.email,
        name: users.name,
        createdAt: users.createdAt
      })
      .from(users)
      .orderBy(desc(users.createdAt))

    console.log('📋 UI State Analysis:\n')

    for (const user of allUsers) {
      // Get user's subscription
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)

      const hasSubscription = subscription.length > 0
      const sub = hasSubscription ? subscription[0] : null
      
      // Determine trial eligibility
      const hasHadTrial = hasSubscription
      const isEligibleForTrial = !hasHadTrial
      
      // Get effective status
      const effectiveStatus = getEffectiveSubscriptionStatus(sub)
      
      // Determine button text
      const buttonText = getButtonText(effectiveStatus, hasHadTrial, isEligibleForTrial)

      console.log(`👤 ${user.name || 'No name'} (${user.email})`)
      
      if (sub) {
        console.log(`   📋 Subscription Details:`)
        console.log(`      Plan: ${sub.plan}`)
        console.log(`      Status: ${sub.status}`)
        console.log(`      Payment Processor: ${sub.paymentProcessor}`)
        
        if (sub.trialEndsAt) {
          const isExpired = new Date() > sub.trialEndsAt
          console.log(`      Trial Ends: ${sub.trialEndsAt.toLocaleDateString()} ${isExpired ? '(EXPIRED)' : '(ACTIVE)'}`)
        }
        
        console.log(`      Effective Status: ${effectiveStatus}`)
      } else {
        console.log(`   📋 No subscription`)
      }
      
      console.log(`   🎯 UI Elements:`)
      console.log(`      Button Text: "${buttonText}"`)
      console.log(`      Can Start Trial: ${isEligibleForTrial ? 'Yes' : 'No'}`)
      console.log(`      Should Show Paywall: ${effectiveStatus === 'trial_expired' || effectiveStatus === 'inactive' ? 'Yes' : 'No'}`)
      
      if (effectiveStatus === 'trial_expired') {
        console.log(`      Paywall Message: "Your free trial has expired"`)
      } else if (effectiveStatus === 'inactive' && !isEligibleForTrial) {
        console.log(`      Paywall Message: "You've already used your trial"`)
      } else if (effectiveStatus === 'inactive' && isEligibleForTrial) {
        console.log(`      Paywall Message: "Start your free trial"`)
      }
      
      console.log('')
    }

    console.log('🧪 Testing Scenarios Ready:')
    console.log('1. Users with expired trials can test payment flows')
    console.log('2. New users can test trial creation')
    console.log('3. Both Stripe (diaspora) and Paystack (continent) can be tested')
    
    console.log('\n✅ UI state verification completed!')

  } catch (error) {
    console.error('❌ Error verifying UI state:', error)
  } finally {
    await client.end()
  }
}

verifyUIState()