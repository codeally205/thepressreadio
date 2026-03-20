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

async function simulateExpiredTrials() {
  try {
    console.log('🧪 Simulating expired trials for testing...\n')
    
    // Get all current subscriptions
    const allSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        trialEndsAt: subscriptions.trialEndsAt,
        paymentProcessor: subscriptions.paymentProcessor,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))

    console.log(`📋 Found ${allSubscriptions.length} subscriptions to modify:\n`)

    for (const sub of allSubscriptions) {
      console.log(`🔍 ${sub.userName || 'No name'} (${sub.userEmail})`)
      console.log(`   Current status: ${sub.status}`)
      console.log(`   Plan: ${sub.plan}`)
      console.log(`   Payment processor: ${sub.paymentProcessor}`)
      
      if (sub.trialEndsAt) {
        console.log(`   Trial ends: ${sub.trialEndsAt.toLocaleDateString()}`)
      }

      // Set trial end date to yesterday to simulate expired trial
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)

      // Update subscription to simulate expired trial
      await db
        .update(subscriptions)
        .set({
          status: 'trialing', // Keep as trialing but with expired date
          trialEndsAt: yesterday, // Set to yesterday so it's expired
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, sub.id))

      console.log(`   🔧 Updated to: trialing with expired trial (${yesterday.toLocaleDateString()})`)
      console.log(`   ✅ User can now test payment flows again\n`)
    }

    // Show final status
    console.log('📊 Final Status Summary:')
    const updatedSubs = await db
      .select({
        id: subscriptions.id,
        plan: subscriptions.plan,
        status: subscriptions.status,
        trialEndsAt: subscriptions.trialEndsAt,
        paymentProcessor: subscriptions.paymentProcessor,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))

    updatedSubs.forEach((sub, index) => {
      const isExpired = sub.trialEndsAt && new Date() > sub.trialEndsAt
      console.log(`\n   ${index + 1}. ${sub.userName || 'No name'} (${sub.userEmail})`)
      console.log(`      Status: ${sub.status}`)
      console.log(`      Plan: ${sub.plan}`)
      console.log(`      Payment processor: ${sub.paymentProcessor}`)
      console.log(`      Trial: ${isExpired ? '❌ EXPIRED' : '✅ Active'}`)
      console.log(`      Can test payments: ${isExpired ? '✅ YES' : '❌ NO'}`)
    })

    console.log('\n🎯 Testing Instructions:')
    console.log('1. Users will now see "Subscribe Now" instead of "Start Free Trial"')
    console.log('2. Paywall will show "Your trial has expired" message')
    console.log('3. Payment flows will work for both Stripe and Paystack')
    console.log('4. After payment, status will change from "trialing" to "active"')
    
    console.log('\n✅ Trial expiration simulation completed!')

  } catch (error) {
    console.error('❌ Error simulating expired trials:', error)
  } finally {
    await client.end()
  }
}

simulateExpiredTrials()