#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and, desc } from 'drizzle-orm'
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

async function fixPaystackSubscriptions() {
  try {
    console.log('🔧 Fixing Paystack subscription statuses...\n')
    
    // Get all successful charge events
    const chargeEvents = await db
      .select()
      .from(paymentEvents)
      .where(and(
        eq(paymentEvents.processor, 'paystack'),
        eq(paymentEvents.eventType, 'charge.success')
      ))
      .orderBy(desc(paymentEvents.createdAt))

    console.log(`📋 Found ${chargeEvents.length} successful charge events`)

    for (const event of chargeEvents) {
      const payload = event.rawPayload
      if (!payload || !payload.data) continue

      const charge = payload.data
      const customerEmail = charge.customer?.email
      const customerCode = charge.customer?.customer_code

      if (!customerEmail) {
        console.log(`⚠️ Skipping event without customer email: ${event.processorEventId}`)
        continue
      }

      console.log(`\n🔍 Processing payment for: ${customerEmail}`)
      console.log(`   Reference: ${charge.reference}`)
      console.log(`   Amount: ${charge.currency} ${charge.amount / 100}`)

      // Find the user
      const user = await db
        .select()
        .from(users)
        .where(eq(users.email, customerEmail))
        .limit(1)

      if (!user.length) {
        console.log(`   ❌ User not found: ${customerEmail}`)
        continue
      }

      // Find their subscription
      const subscription = await db
        .select()
        .from(subscriptions)
        .where(and(
          eq(subscriptions.userId, user[0].id),
          eq(subscriptions.paymentProcessor, 'paystack')
        ))
        .orderBy(desc(subscriptions.createdAt))
        .limit(1)

      if (!subscription.length) {
        console.log(`   ❌ No Paystack subscription found for user`)
        continue
      }

      const sub = subscription[0]
      console.log(`   📋 Found subscription: ${sub.id}`)
      console.log(`   Current status: ${sub.status}`)
      console.log(`   Current customer code: ${sub.paystackCustomerCode || 'None'}`)

      // Update subscription if needed
      if (sub.status !== 'active' || !sub.paystackCustomerCode) {
        const updates = {
          updatedAt: new Date()
        }

        if (sub.status !== 'active') {
          updates.status = 'active'
          console.log(`   🔧 Updating status: ${sub.status} → active`)
        }

        if (!sub.paystackCustomerCode && customerCode) {
          updates.paystackCustomerCode = customerCode
          console.log(`   🔧 Adding customer code: ${customerCode}`)
        }

        await db
          .update(subscriptions)
          .set(updates)
          .where(eq(subscriptions.id, sub.id))

        console.log(`   ✅ Subscription updated successfully`)
      } else {
        console.log(`   ✅ Subscription already active and has customer code`)
      }
    }

    // Summary
    console.log('\n\n📊 Final Status Summary:')
    const finalSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        paymentProcessor: subscriptions.paymentProcessor,
        paystackCustomerCode: subscriptions.paystackCustomerCode,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(eq(subscriptions.paymentProcessor, 'paystack'))
      .orderBy(desc(subscriptions.createdAt))

    finalSubscriptions.forEach((sub, index) => {
      console.log(`\n   ${index + 1}. ${sub.userName || 'No name'} (${sub.userEmail})`)
      console.log(`      Status: ${sub.status}`)
      console.log(`      Plan: ${sub.plan}`)
      console.log(`      Customer Code: ${sub.paystackCustomerCode || 'None'}`)
    })

    console.log('\n✅ Paystack subscription fix completed!')

  } catch (error) {
    console.error('❌ Error fixing subscriptions:', error)
  } finally {
    await client.end()
  }
}

fixPaystackSubscriptions()