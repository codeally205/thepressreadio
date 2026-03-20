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
const client = postgres(connectionString)
const db = drizzle(client)

async function watchForStripeEvents() {
  console.log('👀 Watching for new Stripe webhook events...')
  console.log('Send a test webhook from Stripe Dashboard now!\n')
  
  let lastEventCount = 0
  
  const checkForNewEvents = async () => {
    try {
      // Get Stripe events only
      const stripeEvents = await db
        .select()
        .from(paymentEvents)
        .where(eq(paymentEvents.processor, 'stripe'))
        .orderBy(desc(paymentEvents.createdAt))
        .limit(5)

      if (stripeEvents.length > lastEventCount) {
        console.log(`🎉 New Stripe event detected!`)
        
        const newEvents = stripeEvents.slice(0, stripeEvents.length - lastEventCount)
        
        for (const event of newEvents) {
          console.log(`\n📨 Event: ${event.eventType}`)
          console.log(`   ID: ${event.processorEventId}`)
          console.log(`   Created: ${event.createdAt?.toLocaleString()}`)
          
          const payload = event.rawPayload
          if (payload?.data?.object) {
            console.log(`   Object ID: ${payload.data.object.id}`)
            if (payload.data.object.metadata?.email) {
              console.log(`   Email: ${payload.data.object.metadata.email}`)
            }
          }
        }
        
        lastEventCount = stripeEvents.length
        console.log('\n✅ Stripe webhook is working!')
        console.log('You can now make real payments and they will be processed correctly.')
        
        // Exit after detecting events
        setTimeout(() => {
          client.end()
          process.exit(0)
        }, 1000)
      } else if (stripeEvents.length === 0) {
        process.stdout.write('.')
      }
      
    } catch (error) {
      console.error('❌ Error:', error)
    }
  }
  
  // Check every 2 seconds
  const interval = setInterval(checkForNewEvents, 2000)
  
  // Stop after 60 seconds
  setTimeout(() => {
    clearInterval(interval)
    console.log('\n\n⏰ Timeout reached. No new Stripe events detected.')
    console.log('\nTroubleshooting:')
    console.log('1. Make sure you sent the test webhook from Stripe Dashboard')
    console.log('2. Check if your app is deployed and accessible')
    console.log('3. Verify the webhook URL is correct: https://yourdomain.com/api/webhooks/stripe')
    console.log('4. Check Stripe Dashboard → Webhooks → Recent deliveries for errors')
    client.end()
    process.exit(0)
  }, 60000)
}

watchForStripeEvents()