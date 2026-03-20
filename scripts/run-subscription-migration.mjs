import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { sql } from 'drizzle-orm'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

console.log('🔄 Starting subscription table migration...')

const client = postgres(connectionString)
const db = drizzle(client)

try {
  // Add upgraded_from_trial_id field
  console.log('📝 Adding upgraded_from_trial_id field...')
  await db.execute(sql`
    ALTER TABLE subscriptions 
    ADD COLUMN IF NOT EXISTS upgraded_from_trial_id UUID REFERENCES subscriptions(id)
  `)
  console.log('✅ upgraded_from_trial_id field added')

  // Add payment_reference field
  console.log('📝 Adding payment_reference field...')
  await db.execute(sql`
    ALTER TABLE subscriptions 
    ADD COLUMN IF NOT EXISTS payment_reference TEXT
  `)
  console.log('✅ payment_reference field added')

  // Create indexes
  console.log('📝 Creating indexes...')
  
  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_reference 
    ON subscriptions(payment_reference)
  `)
  console.log('✅ Index on payment_reference created')

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_expiration 
    ON subscriptions(trial_ends_at) 
    WHERE status = 'trialing'
  `)
  console.log('✅ Index on trial_ends_at created')

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_user_processor 
    ON subscriptions(user_id, payment_processor)
  `)
  console.log('✅ Index on user_id and payment_processor created')

  await db.execute(sql`
    CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
    ON subscriptions(status)
  `)
  console.log('✅ Index on status created')

  // Verify the changes
  console.log('\n📊 Verifying migration...')
  const result = await db.execute(sql`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'subscriptions' 
    AND column_name IN ('upgraded_from_trial_id', 'payment_reference')
    ORDER BY column_name
  `)
  
  console.log('\n✅ Migration completed successfully!')
  console.log('New fields added:')
  result.forEach(row => {
    console.log(`  - ${row.column_name} (${row.data_type})`)
  })

  // Check for existing subscriptions that need attention
  const subscriptionsCheck = await db.execute(sql`
    SELECT 
      COUNT(*) as total,
      COUNT(*) FILTER (WHERE status = 'trialing') as trialing,
      COUNT(*) FILTER (WHERE status = 'trialing' AND trial_ends_at < NOW()) as expired_trials
    FROM subscriptions
  `)
  
  console.log('\n📈 Current subscription status:')
  console.log(`  Total subscriptions: ${subscriptionsCheck[0].total}`)
  console.log(`  Currently trialing: ${subscriptionsCheck[0].trialing}`)
  console.log(`  Expired trials (need attention): ${subscriptionsCheck[0].expired_trials}`)

  if (parseInt(subscriptionsCheck[0].expired_trials) > 0) {
    console.log('\n⚠️  Warning: You have expired trials that should be processed.')
    console.log('   Run the expire-trials cron job to clean these up:')
    console.log('   curl -H "Authorization: Bearer $CRON_SECRET" https://your-domain.com/api/cron/expire-trials')
  }

} catch (error) {
  console.error('❌ Migration failed:', error)
  process.exit(1)
} finally {
  await client.end()
  console.log('\n🔌 Database connection closed')
}
