import postgres from 'postgres'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

console.log('🔄 Adding new fields to subscriptions table...\n')

const sql = postgres(connectionString)

async function migrate() {
  try {
    // Add upgraded_from_trial_id field
    console.log('📝 Adding upgraded_from_trial_id field...')
    await sql`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS upgraded_from_trial_id UUID
    `
    console.log('✅ upgraded_from_trial_id field added')

    // Add payment_reference field
    console.log('📝 Adding payment_reference field...')
    await sql`
      ALTER TABLE subscriptions 
      ADD COLUMN IF NOT EXISTS payment_reference TEXT
    `
    console.log('✅ payment_reference field added')

    // Add foreign key constraint for upgraded_from_trial_id
    console.log('📝 Adding foreign key constraint...')
    try {
      await sql`
        ALTER TABLE subscriptions 
        ADD CONSTRAINT fk_upgraded_from_trial 
        FOREIGN KEY (upgraded_from_trial_id) 
        REFERENCES subscriptions(id)
      `
      console.log('✅ Foreign key constraint added')
    } catch (error) {
      if (error.message.includes('already exists')) {
        console.log('ℹ️  Foreign key constraint already exists')
      } else {
        console.log('⚠️  Could not add foreign key constraint:', error.message)
      }
    }

    // Create indexes
    console.log('\n📝 Creating indexes...')
    
    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_reference 
        ON subscriptions(payment_reference)
      `
      console.log('✅ Index on payment_reference created')
    } catch (error) {
      console.log('⚠️  Index creation warning:', error.message)
    }

    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_expiration 
        ON subscriptions(trial_ends_at) 
        WHERE status = 'trialing'
      `
      console.log('✅ Index on trial_ends_at created')
    } catch (error) {
      console.log('⚠️  Index creation warning:', error.message)
    }

    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_subscriptions_user_processor 
        ON subscriptions(user_id, payment_processor)
      `
      console.log('✅ Index on user_id and payment_processor created')
    } catch (error) {
      console.log('⚠️  Index creation warning:', error.message)
    }

    try {
      await sql`
        CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
        ON subscriptions(status)
      `
      console.log('✅ Index on status created')
    } catch (error) {
      console.log('⚠️  Index creation warning:', error.message)
    }

    // Verify the changes
    console.log('\n📊 Verifying migration...')
    const result = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      AND column_name IN ('upgraded_from_trial_id', 'payment_reference')
      ORDER BY column_name
    `
    
    console.log('\n✅ Migration completed successfully!')
    console.log('New fields added:')
    result.forEach(row => {
      console.log(`  - ${row.column_name} (${row.data_type}, nullable: ${row.is_nullable})`)
    })

    // Check for existing subscriptions that need attention
    const subscriptionsCheck = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'trialing') as trialing,
        COUNT(*) FILTER (WHERE status = 'trialing' AND trial_ends_at < NOW()) as expired_trials
      FROM subscriptions
    `
    
    console.log('\n📈 Current subscription status:')
    console.log(`  Total subscriptions: ${subscriptionsCheck[0].total}`)
    console.log(`  Currently trialing: ${subscriptionsCheck[0].trialing}`)
    console.log(`  Expired trials (need attention): ${subscriptionsCheck[0].expired_trials}`)

    if (parseInt(subscriptionsCheck[0].expired_trials) > 0) {
      console.log('\n⚠️  Warning: You have expired trials that should be processed.')
      console.log('   Run the expire-trials cron job to clean these up.')
    }

    console.log('\n✅ All done! You can now restart your application.')

  } catch (error) {
    console.error('\n❌ Migration failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
    console.log('🔌 Database connection closed')
  }
}

migrate()
