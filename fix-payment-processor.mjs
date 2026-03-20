#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, and } from 'drizzle-orm'
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

async function fixPaymentProcessors() {
  try {
    console.log('🔧 Fixing payment processor assignments...\n')
    
    // Find subscriptions with wrong payment processors
    const wrongProcessorSubs = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        paymentProcessor: subscriptions.paymentProcessor,
        paystackCustomerCode: subscriptions.paystackCustomerCode,
        stripeCustomerId: subscriptions.stripeCustomerId,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))
      .where(
        // Find diaspora plans using paystack OR continent plans using stripe
        and(
          // Diaspora plans should use Stripe, not Paystack
          eq(subscriptions.plan, 'diaspora_monthly'),
          eq(subscriptions.paymentProcessor, 'paystack')
        )
      )

    console.log(`📋 Found ${wrongProcessorSubs.length} subscriptions with incorrect payment processors:`)

    for (const sub of wrongProcessorSubs) {
      console.log(`\n🔍 ${sub.userName || 'No name'} (${sub.userEmail})`)
      console.log(`   Plan: ${sub.plan}`)
      console.log(`   Current processor: ${sub.paymentProcessor}`)
      console.log(`   Status: ${sub.status}`)
      
      // Determine correct payment processor
      const correctProcessor = sub.plan.startsWith('diaspora') ? 'stripe' : 'paystack'
      
      if (sub.paymentProcessor !== correctProcessor) {
        console.log(`   🔧 Should be: ${correctProcessor}`)
        
        // Update the subscription
        await db
          .update(subscriptions)
          .set({
            paymentProcessor: correctProcessor,
            // Clear the wrong processor's fields
            paystackCustomerCode: correctProcessor === 'stripe' ? null : sub.paystackCustomerCode,
            paystackSubscriptionCode: correctProcessor === 'stripe' ? null : undefined,
            stripeCustomerId: correctProcessor === 'paystack' ? null : sub.stripeCustomerId,
            stripeSubscriptionId: correctProcessor === 'paystack' ? null : undefined,
            updatedAt: new Date()
          })
          .where(eq(subscriptions.id, sub.id))

        console.log(`   ✅ Updated payment processor to ${correctProcessor}`)
      } else {
        console.log(`   ✅ Payment processor is already correct`)
      }
    }

    // Summary of all subscriptions after fix
    console.log('\n\n📊 Final Payment Processor Summary:')
    const allSubs = await db
      .select({
        id: subscriptions.id,
        plan: subscriptions.plan,
        status: subscriptions.status,
        paymentProcessor: subscriptions.paymentProcessor,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .innerJoin(users, eq(subscriptions.userId, users.id))

    allSubs.forEach((sub, index) => {
      const expectedProcessor = sub.plan.startsWith('diaspora') ? 'stripe' : 'paystack'
      const isCorrect = sub.paymentProcessor === expectedProcessor
      
      console.log(`\n   ${index + 1}. ${sub.userName || 'No name'} (${sub.userEmail})`)
      console.log(`      Plan: ${sub.plan}`)
      console.log(`      Processor: ${sub.paymentProcessor} ${isCorrect ? '✅' : '❌'}`)
      console.log(`      Status: ${sub.status}`)
    })

    console.log('\n✅ Payment processor fix completed!')

  } catch (error) {
    console.error('❌ Error fixing payment processors:', error)
  } finally {
    await client.end()
  }
}

fixPaymentProcessors()