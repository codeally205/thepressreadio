#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq } from 'drizzle-orm'
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

async function fixSubscriptionStatus() {
  try {
    console.log(`🔧 Fixing subscription status for: ${targetEmail}`)
    
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

    console.log(`✅ Found user: ${user[0].name} (${user[0].email})`)

    // Find the subscription
    const userSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id))
      .limit(1)

    if (!userSubscription.length) {
      console.log('❌ No subscription found!')
      return
    }

    const sub = userSubscription[0]
    console.log(`\n📋 Current subscription status:`)
    console.log(`  Plan: ${sub.plan}`)
    console.log(`  Status: ${sub.status}`)
    console.log(`  Trial ends: ${sub.trialEndsAt?.toLocaleDateString()}`)
    console.log(`  Period ends: ${sub.currentPeriodEnd?.toLocaleDateString()}`)

    // Update subscription to active status
    console.log(`\n🔧 Updating subscription to active status...`)
    
    const now = new Date()
    const nextMonth = new Date()
    nextMonth.setMonth(nextMonth.getMonth() + 1)

    await db
      .update(subscriptions)
      .set({
        status: 'active',
        trialEndsAt: null, // Remove trial
        currentPeriodStart: now,
        currentPeriodEnd: nextMonth,
        updatedAt: now,
      })
      .where(eq(subscriptions.id, sub.id))

    console.log(`✅ Subscription updated successfully!`)
    console.log(`   Status: trialing → active`)
    console.log(`   Trial removed`)
    console.log(`   New period: ${now.toLocaleDateString()} - ${nextMonth.toLocaleDateString()}`)

  } catch (error) {
    console.error('❌ Error fixing subscription:', error)
  } finally {
    await client.end()
  }
}

fixSubscriptionStatus()