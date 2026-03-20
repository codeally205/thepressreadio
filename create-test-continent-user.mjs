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

// Load environment variables
dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function createTestContinentUser() {
  try {
    console.log('🌍 Creating test continent user for Paystack testing...\n')
    
    const testEmail = 'test-continent@example.com'
    
    // Check if user already exists
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1)

    let user
    if (existingUser.length > 0) {
      user = existingUser[0]
      console.log(`👤 User already exists: ${user.name} (${user.email})`)
    } else {
      // Create new test user
      const newUser = await db.insert(users).values({
        name: 'Test Continent User',
        email: testEmail,
        authProvider: 'email',
        role: 'viewer',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      user = newUser[0]
      console.log(`✅ Created new user: ${user.name} (${user.email})`)
    }

    // Check if user has existing subscription
    const existingSubscription = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user.id))
      .limit(1)

    if (existingSubscription.length > 0) {
      console.log(`⚠️ User already has a subscription, updating it for testing...`)
      
      // Update existing subscription to expired trial
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      await db
        .update(subscriptions)
        .set({
          plan: 'continent_monthly',
          status: 'trialing',
          trialEndsAt: yesterday, // Expired trial
          currentPeriodStart: new Date(),
          currentPeriodEnd: nextMonth,
          paymentProcessor: 'paystack',
          paystackCustomerCode: null, // Clear any existing codes
          paystackSubscriptionCode: null,
          updatedAt: new Date()
        })
        .where(eq(subscriptions.id, existingSubscription[0].id))

      console.log(`🔧 Updated existing subscription to expired continent trial`)
    } else {
      // Create new expired trial subscription
      const yesterday = new Date()
      yesterday.setDate(yesterday.getDate() - 1)
      
      const nextMonth = new Date()
      nextMonth.setMonth(nextMonth.getMonth() + 1)

      const newSubscription = await db.insert(subscriptions).values({
        userId: user.id,
        plan: 'continent_monthly',
        status: 'trialing',
        trialEndsAt: yesterday, // Expired trial
        currentPeriodStart: new Date(),
        currentPeriodEnd: nextMonth,
        paymentProcessor: 'paystack',
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning()

      console.log(`✅ Created expired trial subscription: ${newSubscription[0].id}`)
    }

    console.log('\n📋 Test User Details:')
    console.log(`   Email: ${testEmail}`)
    console.log(`   Name: Test Continent User`)
    console.log(`   Plan: continent_monthly`)
    console.log(`   Status: trialing (EXPIRED)`)
    console.log(`   Payment Processor: paystack`)

    console.log('\n🧪 Testing Instructions:')
    console.log('1. Login with email: test-continent@example.com')
    console.log('2. Go to /subscribe page')
    console.log('3. You should see "Subscribe Now" for continent plans')
    console.log('4. Click subscribe to test Paystack payment flow')
    console.log('5. Use Paystack test cards for testing')

    console.log('\n💳 Paystack Test Cards:')
    console.log('   Success: 4084084084084081')
    console.log('   Decline: 4084084084084081 (with wrong CVV)')
    console.log('   CVV: 408, PIN: 1234')

    console.log('\n✅ Test continent user setup completed!')

  } catch (error) {
    console.error('❌ Error creating test user:', error)
  } finally {
    await client.end()
  }
}

createTestContinentUser()