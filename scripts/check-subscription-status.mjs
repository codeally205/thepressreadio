#!/usr/bin/env node

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { subscriptions, users, paymentEvents } from '../lib/db/schema.js'
import { eq, desc } from 'drizzle-orm'

config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function checkSubscriptionStatus() {
  try {
    console.log('🔍 Checking subscription status for alliancedamour88@gmail.com...')
    
    // Find user
    const user = await db.select().from(users).where(eq(users.email, 'alliancedamour88@gmail.com')).limit(1)
    
    if (user.length === 0) {
      console.log('❌ User not found')
      return
    }
    
    console.log('✅ User found:', {
      id: user[0].id,
      email: user[0].email,
      name: user[0].name
    })
    
    // Check subscriptions
    const userSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(eq(subscriptions.userId, user[0].id))
      .orderBy(desc(subscriptions.createdAt))
    
    console.log(`\n📋 Found ${userSubscriptions.length} subscription(s):`)
    userSubscriptions.forEach((sub, index) => {
      console.log(`\nSubscription ${index + 1}:`)
      console.log(`  Plan: ${sub.plan}`)
      console.log(`  Status: ${sub.status}`)
      console.log(`  Payment Processor: ${sub.paymentProcessor}`)
      console.log(`  Created: ${sub.createdAt}`)
      console.log(`  Current Period: ${sub.currentPeriodStart} - ${sub.currentPeriodEnd}`)
      console.log(`  Trial Ends: ${sub.trialEndsAt}`)
      console.log(`  Paystack Code: ${sub.paystackSubscriptionCode}`)
      console.log(`  Paystack Customer: ${sub.paystackCustomerCode}`)
    })
    
    // Check payment events
    const events = await db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.processor, 'paystack'))
      .orderBy(desc(paymentEvents.createdAt))
      .limit(10)
    
    console.log(`\n🎯 Recent Paystack payment events (last 10):`)
    events.forEach((event, index) => {
      console.log(`\nEvent ${index + 1}:`)
      console.log(`  Type: ${event.eventType}`)
      console.log(`  Processor Event ID: ${event.processorEventId}`)
      console.log(`  Created: ${event.createdAt}`)
      console.log(`  Payload: ${JSON.stringify(event.rawPayload, null, 2)}`)
    })
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.end()
  }
}

checkSubscriptionStatus()