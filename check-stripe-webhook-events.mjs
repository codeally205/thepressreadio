import { db } from './lib/db/index.ts'
import { paymentEvents } from './lib/db/schema.ts'
import { eq, desc } from 'drizzle-orm'

console.log('🔍 Checking recent Stripe webhook events...\n')

const events = await db.query.paymentEvents.findMany({
  where: eq(paymentEvents.processor, 'stripe'),
  orderBy: [desc(paymentEvents.createdAt)],
  limit: 10
})

if (events.length === 0) {
  console.log('❌ No Stripe webhook events found in database')
  console.log('\nThis means either:')
  console.log('1. Stripe webhooks are not configured in production')
  console.log('2. The webhook endpoint is not receiving events')
  console.log('3. The webhook secret is incorrect')
  console.log('\nTo fix:')
  console.log('1. Go to Stripe Dashboard > Developers > Webhooks')
  console.log('2. Add endpoint: https://thepressreadio-production.up.railway.app/api/webhooks/stripe')
  console.log('3. Select events: customer.subscription.created, customer.subscription.updated, customer.subscription.deleted, invoice.payment_succeeded, invoice.payment_failed')
  console.log('4. Copy the webhook signing secret and add to STRIPE_WEBHOOK_SECRET env var')
} else {
  console.log(`✅ Found ${events.length} recent Stripe webhook events:\n`)
  
  events.forEach((event, index) => {
    console.log(`${index + 1}. Event:`, {
      type: event.eventType,
      id: event.processorEventId,
      createdAt: event.createdAt,
      metadata: event.metadata ? JSON.stringify(event.metadata).substring(0, 200) + '...' : 'none'
    })
    console.log('')
  })
}

process.exit(0)
