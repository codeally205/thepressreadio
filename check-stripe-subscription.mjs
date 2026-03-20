import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function checkStripeSubscription() {
  console.log('🔍 Checking Stripe Subscription Issue\n')
  console.log('='.repeat(70))
  
  const email = 'emmabyiringiro215@gmail.com'
  
  console.log(`\n1️⃣ Checking all subscriptions for ${email}...\n`)
  
  const allSubscriptions = await sql`
    SELECT 
      s.id,
      s.plan,
      s.status,
      s.trial_ends_at,
      s.current_period_start,
      s.current_period_end,
      s.payment_processor,
      s.stripe_subscription_id,
      s.paystack_customer_code,
      s.payment_reference,
      s.created_at,
      s.updated_at
    FROM subscriptions s
    JOIN "user" u ON s.user_id = u.id
    WHERE u.email = ${email}
    ORDER BY s.created_at DESC
  `
  
  console.log(`Found ${allSubscriptions.length} subscription(s):\n`)
  
  allSubscriptions.forEach((sub, i) => {
    console.log(`${i + 1}. Subscription ID: ${sub.id}`)
    console.log(`   Plan: ${sub.plan}`)
    console.log(`   Status: ${sub.status}`)
    console.log(`   Processor: ${sub.payment_processor}`)
    console.log(`   Period: ${sub.current_period_start} → ${sub.current_period_end}`)
    console.log(`   Stripe Sub ID: ${sub.stripe_subscription_id || 'N/A'}`)
    console.log(`   Paystack Ref: ${sub.payment_reference || 'N/A'}`)
    console.log(`   Created: ${sub.created_at}`)
    console.log(`   Updated: ${sub.updated_at}`)
    console.log('')
  })
  
  console.log('='.repeat(70))
  console.log('\n2️⃣ Checking recent payment events...\n')
  
  const recentEvents = await sql`
    SELECT 
      id,
      processor,
      event_type,
      processor_event_id,
      status,
      created_at
    FROM payment_events
    WHERE processor = 'stripe'
    ORDER BY created_at DESC
    LIMIT 10
  `
  
  if (recentEvents.length > 0) {
    console.log(`Found ${recentEvents.length} recent Stripe events:\n`)
    recentEvents.forEach((event, i) => {
      console.log(`${i + 1}. ${event.event_type}`)
      console.log(`   Event ID: ${event.processor_event_id}`)
      console.log(`   Status: ${event.status || 'N/A'}`)
      console.log(`   Created: ${event.created_at}`)
      console.log('')
    })
  } else {
    console.log('❌ No Stripe payment events found!')
    console.log('This means the Stripe webhook is not being called or is failing.')
  }
  
  console.log('='.repeat(70))
  console.log('\n3️⃣ Diagnosis:\n')
  
  const hasActiveSubscription = allSubscriptions.some(sub => 
    sub.status === 'active' && new Date(sub.current_period_end) > new Date()
  )
  
  const hasStripeSubscription = allSubscriptions.some(sub => 
    sub.stripe_subscription_id !== null
  )
  
  if (!hasActiveSubscription) {
    console.log('❌ PROBLEM: No active subscription found')
    console.log('\nPossible causes:')
    console.log('1. Stripe webhook not configured or not working')
    console.log('2. Stripe webhook secret is incorrect')
    console.log('3. Stripe payment succeeded but webhook failed')
    console.log('4. User completed payment but webhook hasn\'t fired yet')
    console.log('\nSOLUTION:')
    console.log('1. Check Stripe dashboard for webhook events')
    console.log('2. Verify STRIPE_WEBHOOK_SECRET in .env')
    console.log('3. Check server logs for webhook errors')
    console.log('4. Manually create subscription if webhook failed')
  }
  
  if (!hasStripeSubscription) {
    console.log('\n❌ No Stripe subscription ID found')
    console.log('This confirms the webhook hasn\'t processed the payment yet.')
  }
  
  console.log('\n='.repeat(70))
  console.log('NEXT STEPS:\n')
  console.log('1. Check if Stripe webhook is configured in Stripe dashboard')
  console.log('2. Check if webhook secret matches .env file')
  console.log('3. Look at Stripe dashboard → Developers → Webhooks → Events')
  console.log('4. If webhook failed, we can manually create the subscription')
}

checkStripeSubscription().catch(console.error)
