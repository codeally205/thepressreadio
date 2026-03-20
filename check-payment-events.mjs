#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { eq, desc } from 'drizzle-orm'
import { pgTable, uuid, text, timestamp, json } from 'drizzle-orm/pg-core'
import dotenv from 'dotenv'

// Define payment events schema
const paymentEvents = pgTable('payment_events', {
  id: uuid('id').primaryKey().defaultRandom(),
  processor: text('processor').notNull(),
  eventType: text('event_type').notNull(),
  processorEventId: text('processor_event_id').notNull().unique(),
  rawPayload: json('raw_payload').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
})

dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function checkPaymentEvents() {
  try {
    console.log('🔍 Checking recent payment events...')
    
    // Get recent Stripe events
    const recentEvents = await db
      .select()
      .from(paymentEvents)
      .where(eq(paymentEvents.processor, 'stripe'))
      .orderBy(desc(paymentEvents.createdAt))
      .limit(10)

    console.log(`📋 Found ${recentEvents.length} recent Stripe events:\n`)

    for (const event of recentEvents) {
      console.log(`Event ID: ${event.processorEventId}`)
      console.log(`  Type: ${event.eventType}`)
      console.log(`  Created: ${event.createdAt?.toLocaleString()}`)
      
      // Check if this event relates to our user
      const payload = event.rawPayload
      if (payload?.data?.object?.metadata?.email === 'blinktechnologies125@gmail.com') {
        console.log(`  ✅ Related to our user!`)
        console.log(`  Customer: ${payload.data.object.customer}`)
        console.log(`  Subscription: ${payload.data.object.id}`)
      }
      console.log('')
    }

  } catch (error) {
    console.error('❌ Error checking payment events:', error)
  } finally {
    await client.end()
  }
}

checkPaymentEvents()