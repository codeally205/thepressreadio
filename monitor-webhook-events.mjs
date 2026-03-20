#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { desc } from 'drizzle-orm'
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
const client = postgres(connectionString)
const db = drizzle(client)

async function monitorWebhookEvents() {
  try {
    console.log('📡 Monitoring recent webhook events...\n')
    
    // Get recent events
    const recentEvents = await db
      .select()
      .from(paymentEvents)
      .orderBy(desc(paymentEvents.createdAt))
      .limit(10)

    if (recentEvents.length === 0) {
      console.log('📭 No webhook events found in database')
      console.log('\nThis means either:')
      console.log('• No webhooks have been sent yet')
      console.log('• Webhooks are failing to process')
      console.log('• Webhook secret is incorrect')
      
      console.log('\n🧪 To test:')
      console.log('1. Update your STRIPE_WEBHOOK_SECRET in .env')
      console.log('2. Deploy your app')
      console.log('3. Send a test webhook from Stripe Dashboard')
      console.log('4. Run this script again')
      
      return
    }

    console.log(`📋 Found ${recentEvents.length} recent events:\n`)

    for (const event of recentEvents) {
      console.log(`Event: ${event.eventType}`)
      console.log(`  ID: ${event.processorEventId}`)
      console.log(`  Processor: ${event.processor}`)
      console.log(`  Created: ${event.createdAt?.toLocaleString()}`)
      
      // Check if this is a subscription event
      if (event.eventType.includes('subscription')) {
        const payload = event.rawPayload
        console.log(`  📧 Email: ${payload?.data?.object?.metadata?.email || 'Not found'}`)
        console.log(`  🆔 Subscription ID: ${payload?.data?.object?.id || 'Not found'}`)
      }
      console.log('')
    }

    console.log('✅ Webhooks are being processed!')
    console.log('Check your subscription status with: node check-user-subscription.mjs')

  } catch (error) {
    console.error('❌ Error monitoring events:', error)
  } finally {
    await client.end()
  }
}

monitorWebhookEvents()