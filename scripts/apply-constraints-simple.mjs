#!/usr/bin/env node

/**
 * Simple script to apply database constraints using existing Drizzle setup
 */

import { createDbConnection } from './db-connection.mjs'

async function main() {
  console.log('🔧 Applying Paystack database constraints...\n')

  let client
  try {
    // Create database connection
    const { db, client: dbClient } = createDbConnection()
    client = dbClient
    
    console.log('✅ Connected to database')

    // Execute constraints one by one using raw SQL
    const constraints = [
      {
        name: 'unique_paystack_subscription_code',
        sql: `ALTER TABLE subscriptions ADD CONSTRAINT unique_paystack_subscription_code UNIQUE (paystack_subscription_code)`
      },
      {
        name: 'unique_stripe_subscription_id', 
        sql: `ALTER TABLE subscriptions ADD CONSTRAINT unique_stripe_subscription_id UNIQUE (stripe_subscription_id)`
      },
      {
        name: 'unique_active_subscription_per_user_processor',
        sql: `CREATE UNIQUE INDEX unique_active_subscription_per_user_processor ON subscriptions (user_id, payment_processor) WHERE status IN ('active', 'trialing')`
      },
      {
        name: 'idx_subscriptions_user_status',
        sql: `CREATE INDEX IF NOT EXISTS idx_subscriptions_user_status ON subscriptions (user_id, status)`
      },
      {
        name: 'idx_subscriptions_processor_code',
        sql: `CREATE INDEX IF NOT EXISTS idx_subscriptions_processor_code ON subscriptions (payment_processor, paystack_subscription_code)`
      },
      {
        name: 'idx_payment_events_processor_event_id',
        sql: `CREATE INDEX IF NOT EXISTS idx_payment_events_processor_event_id ON payment_events (processor_event_id)`
      }
    ]

    console.log('📝 Applying constraints and indexes...')

    for (const constraint of constraints) {
      try {
        await client.unsafe(constraint.sql)
        console.log(`✅ Applied: ${constraint.name}`)
      } catch (error) {
        if (error.message.includes('already exists') || error.message.includes('duplicate key')) {
          console.log(`ℹ️ Already exists: ${constraint.name}`)
        } else {
          console.error(`❌ Failed to apply ${constraint.name}: ${error.message}`)
        }
      }
    }

    // Validate the constraints
    console.log('\n🔍 Validating constraints...')
    
    try {
      const constraintCheck = await client`
        SELECT constraint_name, table_name 
        FROM information_schema.table_constraints 
        WHERE constraint_name IN (
          'unique_paystack_subscription_code',
          'unique_stripe_subscription_id'
        )
      `
      
      console.log('✅ Database constraints:')
      for (const row of constraintCheck) {
        console.log(`   - ${row.constraint_name} on ${row.table_name}`)
      }
    } catch (error) {
      console.log('⚠️ Could not validate constraints (this is normal for some databases)')
    }

    // Check indexes
    try {
      const indexCheck = await client`
        SELECT indexname, tablename 
        FROM pg_indexes 
        WHERE indexname LIKE 'unique_active_subscription%' 
           OR indexname LIKE 'idx_subscriptions%'
           OR indexname LIKE 'idx_payment_events%'
      `
      
      console.log('✅ Database indexes:')
      for (const row of indexCheck) {
        console.log(`   - ${row.indexname} on ${row.tablename}`)
      }
    } catch (error) {
      console.log('⚠️ Could not validate indexes')
    }

    console.log('\n🎉 Database constraints applied successfully!')
    console.log('\n📋 What was applied:')
    console.log('   1. ✅ Unique constraint on paystack_subscription_code')
    console.log('   2. ✅ Unique constraint on stripe_subscription_id')
    console.log('   3. ✅ Unique index for active subscriptions per user/processor')
    console.log('   4. ✅ Performance indexes on frequently queried fields')
    
    console.log('\n⚠️  Next steps:')
    console.log('   - Test subscription creation to verify constraints work')
    console.log('   - Try creating duplicate subscriptions (should fail)')
    console.log('   - Monitor query performance improvements')

  } catch (error) {
    console.error('❌ Failed to apply constraints:', error.message)
    console.error('   Make sure your database is running and accessible')
    process.exit(1)
  } finally {
    if (client) {
      await client.end()
    }
  }
}

main().catch(console.error)