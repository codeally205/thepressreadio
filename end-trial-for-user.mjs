#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, desc } from 'drizzle-orm'
import { pgTable, uuid, text, timestamp, boolean } from 'drizzle-orm/pg-core'
import dotenv from 'dotenv'

// Define schemas inline to avoid import issues
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

const targetEmail = 'blinktechnologies125@gmail.com'

async function endTrialForUser() {
  try {
    console.log(`🔍 Looking for user: ${targetEmail}`)
    
    // Find the user
    const user = await db
      .select()
      .from(users)
      .where(eq(users.email, targetEmail))
      .limit(1)

    if (!user.length) {
      console.log('❌ User not found!')
      return
    }

    console.log(`✅ Found user: ${user[0].name || 'No name'} (${user[0].email})`)

    // Find their current subscription
    const subscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1)

    if (!subscription.length) {
      console.log('❌ No subscription found for this user!')
      return
    }

    const sub = subscription[0]
    console.log(`\n📋 Current subscription:`)
    console.log(`   ID: ${sub.id}`)
    console.log(`   Plan: ${sub.plan}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Trial ends: ${sub.trialEndsAt?.toLocaleDateString() || 'No trial'}`)
    console.log(`   Period ends: ${sub.currentPeriodEnd?.toLocaleDateString()}`)

    if (sub.status !== 'trialing') {
      console.log('❌ User is not currently on a trial!')
      return
    }

    // End the trial by setting trialEndsAt to yesterday
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    console.log(`\n🔧 Ending trial by setting trialEndsAt to: ${yesterday.toLocaleDateString()}`)

    await db
      .update(subscriptions)
      .set({
        trialEndsAt: yesterday,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.id, sub.id))

    console.log('✅ Trial ended successfully!')
    console.log('\nNow the user should see:')
    console.log('- Status: trial_expired')
    console.log('- Message encouraging them to subscribe')
    console.log('- Ability to start a new paid subscription')

  } catch (error) {
    console.error('❌ Error ending trial:', error)
  } finally {
    await client.end()
  }
}

endTrialForUser()