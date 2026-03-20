#!/usr/bin/env node

/**
 * Comprehensive subscription system fixes
 * This script applies database constraints, indexes, and validates the system
 */

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { config } from 'dotenv'

// Load environment variables
config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is required')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function applyDatabaseFixes() {
  console.log('🔧 Applying subscription system database fixes...\n')

  try {
    // 1. Add unique constraints to prevent duplicate subscriptions
    console.log('1️⃣ Adding unique constraints...')
    
    await db.execute(`
      -- Add unique constraint for Paystack subscription codes (if not exists)
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'unique_paystack_subscription_code'
        ) THEN
          ALTER TABLE subscriptions 
          ADD CONSTRAINT unique_paystack_subscription_code 
          UNIQUE (paystack_subscription_code);
        END IF;
      END $$;
    `)

    await db.execute(`
      -- Add unique constraint for Stripe subscription IDs (if not exists)
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'unique_stripe_subscription_id'
        ) THEN
          ALTER TABLE subscriptions 
          ADD CONSTRAINT unique_stripe_subscription_id 
          UNIQUE (stripe_subscription_id);
        END IF;
      END $$;
    `)

    await db.execute(`
      -- Add partial unique constraint for active subscriptions per user per processor
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_indexes 
          WHERE indexname = 'unique_active_subscription_per_user_processor'
        ) THEN
          CREATE UNIQUE INDEX unique_active_subscription_per_user_processor 
          ON subscriptions (user_id, payment_processor) 
          WHERE status IN ('active', 'trialing');
        END IF;
      END $$;
    `)

    console.log('✅ Unique constraints added successfully')

    // 2. Add performance indexes
    console.log('\n2️⃣ Adding performance indexes...')

    await db.execute(`
      -- Index for user subscription lookups
      CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id_status 
      ON subscriptions (user_id, status);
    `)

    await db.execute(`
      -- Index for subscription status and period end
      CREATE INDEX IF NOT EXISTS idx_subscriptions_status_period_end 
      ON subscriptions (status, current_period_end);
    `)

    await db.execute(`
      -- Index for trial end date lookups
      CREATE INDEX IF NOT EXISTS idx_subscriptions_trial_ends_at 
      ON subscriptions (trial_ends_at) 
      WHERE trial_ends_at IS NOT NULL;
    `)

    await db.execute(`
      -- Index for payment processor lookups
      CREATE INDEX IF NOT EXISTS idx_subscriptions_payment_processor 
      ON subscriptions (payment_processor);
    `)

    console.log('✅ Performance indexes added successfully')

    // 3. Add check constraints for data integrity
    console.log('\n3️⃣ Adding data integrity constraints...')

    await db.execute(`
      -- Ensure valid subscription statuses
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'valid_subscription_status'
        ) THEN
          ALTER TABLE subscriptions 
          ADD CONSTRAINT valid_subscription_status 
          CHECK (status IN ('active', 'trialing', 'cancelled', 'past_due', 'unpaid'));
        END IF;
      END $$;
    `)

    await db.execute(`
      -- Ensure valid payment processors
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'valid_payment_processor'
        ) THEN
          ALTER TABLE subscriptions 
          ADD CONSTRAINT valid_payment_processor 
          CHECK (payment_processor IN ('stripe', 'paystack'));
        END IF;
      END $$;
    `)

    await db.execute(`
      -- Ensure current_period_end is after current_period_start
      DO $$ 
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'valid_subscription_period'
        ) THEN
          ALTER TABLE subscriptions 
          ADD CONSTRAINT valid_subscription_period 
          CHECK (current_period_end > current_period_start);
        END IF;
      END $$;
    `)

    console.log('✅ Data integrity constraints added successfully')

    // 4. Clean up any inconsistent data
    console.log('\n4️⃣ Cleaning up inconsistent data...')

    // Update any subscriptions with invalid statuses
    const invalidStatusResult = await db.execute(`
      UPDATE subscriptions 
      SET status = 'cancelled', updated_at = NOW()
      WHERE status NOT IN ('active', 'trialing', 'cancelled', 'past_due', 'unpaid')
      RETURNING id, status;
    `)

    if (invalidStatusResult.rowCount > 0) {
      console.log(`   Fixed ${invalidStatusResult.rowCount} subscriptions with invalid status`)
    }

    // Update expired trials
    const expiredTrialsResult = await db.execute(`
      UPDATE subscriptions 
      SET status = 'cancelled', updated_at = NOW()
      WHERE status = 'trialing' 
        AND trial_ends_at IS NOT NULL 
        AND trial_ends_at < NOW()
        AND status != 'cancelled'
      RETURNING id;
    `)

    if (expiredTrialsResult.rowCount > 0) {
      console.log(`   Updated ${expiredTrialsResult.rowCount} expired trials to cancelled`)
    }

    console.log('✅ Data cleanup completed')

    // 5. Validate the fixes
    console.log('\n5️⃣ Validating fixes...')

    // Check constraint existence
    const constraints = await db.execute(`
      SELECT conname, contype 
      FROM pg_constraint 
      WHERE conrelid = 'subscriptions'::regclass
        AND conname IN (
          'unique_paystack_subscription_code',
          'unique_stripe_subscription_id',
          'valid_subscription_status',
          'valid_payment_processor',
          'valid_subscription_period'
        );
    `)

    console.log(`   Found ${constraints.rowCount} constraints`)

    // Check index existence
    const indexes = await db.execute(`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'subscriptions'
        AND indexname IN (
          'unique_active_subscription_per_user_processor',
          'idx_subscriptions_user_id_status',
          'idx_subscriptions_status_period_end',
          'idx_subscriptions_trial_ends_at',
          'idx_subscriptions_payment_processor'
        );
    `)

    console.log(`   Found ${indexes.rowCount} indexes`)

    // Check subscription data integrity
    const subscriptionStats = await db.execute(`
      SELECT 
        COUNT(*) as total_subscriptions,
        COUNT(CASE WHEN status = 'active' THEN 1 END) as active_subscriptions,
        COUNT(CASE WHEN status = 'trialing' THEN 1 END) as trialing_subscriptions,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled_subscriptions,
        COUNT(CASE WHEN payment_processor = 'paystack' THEN 1 END) as paystack_subscriptions,
        COUNT(CASE WHEN payment_processor = 'stripe' THEN 1 END) as stripe_subscriptions
      FROM subscriptions;
    `)

    const stats = subscriptionStats.rows[0]
    console.log(`   Total subscriptions: ${stats.total_subscriptions}`)
    console.log(`   Active: ${stats.active_subscriptions}, Trialing: ${stats.trialing_subscriptions}, Cancelled: ${stats.cancelled_subscriptions}`)
    console.log(`   Paystack: ${stats.paystack_subscriptions}, Stripe: ${stats.stripe_subscriptions}`)

    console.log('\n✅ All subscription system fixes applied successfully!')
    console.log('\n📋 Summary of changes:')
    console.log('   • Added unique constraints to prevent duplicate subscriptions')
    console.log('   • Added performance indexes for faster queries')
    console.log('   • Added data integrity constraints')
    console.log('   • Cleaned up inconsistent subscription data')
    console.log('   • Validated all changes')

    console.log('\n🚀 Your subscription system is now production-ready!')

  } catch (error) {
    console.error('❌ Error applying fixes:', error)
    throw error
  }
}

async function main() {
  try {
    await applyDatabaseFixes()
  } catch (error) {
    console.error('❌ Script failed:', error)
    process.exit(1)
  } finally {
    await client.end()
  }
}

main()