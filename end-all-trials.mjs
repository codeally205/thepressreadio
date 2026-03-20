#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and, isNotNull } from 'drizzle-orm'
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

async function endAllTrials() {
  try {
    console.log('🔍 Looking for users currently on trial...')
    
    // Find all users with active trials
    const trialUsers = await db
      .select({
        userId: subscriptions.userId,
        subscriptionId: subscriptions.id,
        userEmail: users.email,
        userName: users.name,
        plan: subscriptions.plan,
        status: subscriptions.status,
        trialEndsAt: subscriptions.trialEndsAt,
        currentPeriodEnd: subscriptions.currentPeriodEnd
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.status, 'trialing'))

    if (!trialUsers.length) {
      console.log('✅ No users currently on trial!')
      return
    }

    console.log(`\n📋 Found ${trialUsers.length} users on trial:`)
    trialUsers.forEach((user, index) => {
      console.log(`\n${index + 1}. ${user.userName || 'No name'} (${user.userEmail})`)
      console.log(`   Plan: ${user.plan}`)
      console.log(`   Status: ${user.status}`)
      console.log(`   Trial ends: ${user.trialEndsAt?.toLocaleDateString() || 'No trial end date'}`)
      console.log(`   Period ends: ${user.currentPeriodEnd?.toLocaleDateString()}`)
    })

    // Confirm before proceeding
    console.log(`\n⚠️  This will end trials for ${trialUsers.length} users.`)
    console.log('They will need to subscribe to continue accessing premium content.')
    
    // Set trial end date to yesterday for all trialing subscriptions
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)

    console.log(`\n🔧 Ending all trials by setting trialEndsAt to: ${yesterday.toLocaleDateString()}`)

    const result = await db
      .update(subscriptions)
      .set({
        trialEndsAt: yesterday,
        updatedAt: new Date()
      })
      .where(eq(subscriptions.status, 'trialing'))
      .returning({ id: subscriptions.id })

    console.log(`✅ Successfully ended trials for ${result.length} subscriptions!`)
    
    console.log('\n📧 These users will now see:')
    console.log('- Status: trial_expired')
    console.log('- Paywall on premium content')
    console.log('- Subscription prompts')
    console.log('- Ability to start paid subscriptions')

    console.log('\n💡 Next steps:')
    console.log('1. Users will be prompted to subscribe when accessing premium content')
    console.log('2. They can choose monthly or yearly plans')
    console.log('3. Payment will be processed through Paystack or Stripe')
    console.log('4. Consider sending email notifications about trial expiration')

  } catch (error) {
    console.error('❌ Error ending trials:', error)
  } finally {
    await client.end()
  }
}

endAllTrials()