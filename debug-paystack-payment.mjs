#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, desc } from 'drizzle-orm'
import { pgTable, uuid, text, timestamp, boolean, jsonb } from 'drizzle-orm/pg-core'
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

const paymentEvents = pgTable('payment_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  processor: text('processor').notNull(),
  eventType: text('event_type').notNull(),
  processorEventId: text('processor_event_id').notNull().unique(),
  rawPayload: jsonb('raw_payload'),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
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

async function debugPaystackPayments() {
  try {
    console.log('🔍 Checking recent Paystack payment activity...\n')
    
    // Check recent payment events
    console.log('📋 Recent Payment Events:')
    const recentEvents = await db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.processor, 'paystack'))
      .orderBy(desc(paymentEvents.createdAt))
      .limit(5)

    if (recentEvents.length === 0) {
      console.log('   No Paystack payment events found')
    } else {
      recentEvents.forEach((event, index) => {
        console.log(`\n   ${index + 1}. Event: ${event.eventType}`)
        console.log(`      ID: ${event.processorEventId}`)
        console.log(`      Created: ${event.createdAt?.toLocaleString()}`)
        if (event.rawPayload && typeof event.rawPayload === 'object') {
          const payload = event.rawPayload
          if (payload.data?.reference) {
            console.log(`      Reference: ${payload.data.reference}`)
          }
          if (payload.data?.customer?.email) {
            console.log(`      Customer: ${payload.data.customer.email}`)
          }
        }
      })
    }

    // Check recent subscriptions
    console.log('\n\n📋 Recent Paystack Subscriptions:')
    const recentSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        paymentProcessor: subscriptions.paymentProcessor,
        paystackCustomerCode: subscriptions.paystackCustomerCode,
        createdAt: subscriptions.createdAt,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.paymentProcessor, 'paystack'))
      .orderBy(desc(subscriptions.createdAt))
      .limit(5)

    if (recentSubscriptions.length === 0) {
      console.log('   No Paystack subscriptions found')
    } else {
      recentSubscriptions.forEach((sub, index) => {
        console.log(`\n   ${index + 1}. ${sub.userName || 'No name'} (${sub.userEmail})`)
        console.log(`      Plan: ${sub.plan}`)
        console.log(`      Status: ${sub.status}`)
        console.log(`      Customer Code: ${sub.paystackCustomerCode || 'None'}`)
        console.log(`      Created: ${sub.createdAt?.toLocaleString()}`)
      })
    }

    // Check for users without subscriptions who might have made payments
    console.log('\n\n🔍 Checking for potential missing subscriptions...')
    
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

    console.log('\n📋 Recent Users (check if they have subscriptions):')
    for (const user of allUsers) {
      const userSubscription = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, user.id))
        .limit(1)

      console.log(`\n   ${user.name || 'No name'} (${user.email})`)
      console.log(`   Created: ${user.createdAt?.toLocaleString()}`)
      console.log(`   Has subscription: ${userSubscription.length > 0 ? 'Yes' : 'No'}`)
      
      if (userSubscription.length > 0) {
        console.log(`   Subscription status: ${userSubscription[0].status}`)
        console.log(`   Payment processor: ${userSubscription[0].paymentProcessor}`)
      }
    }

  } catch (error) {
    console.error('❌ Error checking payments:', error)
  } finally {
    await client.end()
  }
}

debugPaystackPayments()