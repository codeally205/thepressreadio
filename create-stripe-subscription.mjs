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

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

const targetEmail = 'blinktechnologies125@gmail.com'

async function createStripeSubscription() {
  try {
    console.log(`🔧 Creating Stripe subscription for: ${targetEmail}`)
    
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

    // Delete the old expired trial subscription
    const oldSub = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id))
      .orderBy(desc(subscriptions.createdAt))
      .limit(1)

    if (oldSub.length) {
      console.log(`🗑️ Deleting old subscription: ${oldSub[0].id}`)
      await db
        .delete(subscriptions)
        .where(eq(subscriptions.id, oldSub[0].id))
    }

    // Create new active Stripe subscription
    const now = new Date()
    const periodEnd = new Date()
    periodEnd.setMonth(periodEnd.getMonth() + 1) // 1 month from now

    const newSubscription = await db.insert(subscriptions).values({
      userId: user[0].id,
      plan: 'diaspora_monthly',
      status: 'active',
      trialEndsAt: null, // No trial for paid subscription
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      stripeSubscriptionId: 'sub_test_' + Date.now(), // Fake Stripe ID for testing
      stripeCustomerId: 'cus_test_' + Date.now(), // Fake customer ID
      paymentProcessor: 'stripe',
      createdAt: now,
      updatedAt: now,
    }).returning()

    console.log('✅ Created new Stripe subscription:')
    console.log(`   ID: ${newSubscription[0].id}`)
    console.log(`   Plan: ${newSubscription[0].plan}`)
    console.log(`   Status: ${newSubscription[0].status}`)
    console.log(`   Payment Processor: ${newSubscription[0].paymentProcessor}`)
    console.log(`   Period ends: ${newSubscription[0].currentPeriodEnd.toLocaleDateString()}`)

    console.log('\n✅ Done! The user should now see an active Stripe subscription.')

  } catch (error) {
    console.error('❌ Error creating subscription:', error)
  } finally {
    await client.end()
  }
}

createStripeSubscription()