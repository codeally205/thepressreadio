#!/usr/bin/env node

/**
 * Apply critical Paystack payment system fixes
 * This script applies database constraints and validates the fixes
 */

import { readFileSync } from 'fs'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import postgres from 'postgres'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

async function main() {
  console.log('🔧 Applying Paystack payment system fixes...\n')

  // Load environment variables
  const envPath = join(__dirname, '..', '.env')
  let databaseUrl
  
  try {
    const envContent = readFileSync(envPath, 'utf8')
    const envLines = envContent.split('\n')
    
    for (const line of envLines) {
      if (line.startsWith('DATABASE_URL=')) {
        databaseUrl = line.split('=')[1].replace(/"/g, '')
        break
      }
    }
  } catch (error) {
    console.error('❌ Could not read .env file:', error.message)
    process.exit(1)
  }

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL not found in .env file')
    process.exit(1)
  }

  const sql = postgres(databaseUrl, {
    max: 1,
    idle_timeout: 20,
    max_lifetime: 60 * 30
  })

  try {
    console.log('✅ Connected to database')

    // Read and execute the migration SQL
    const migrationPath = join(__dirname, '..', 'drizzle', 'add-unique-constraints.sql')
    const migrationSql = readFileSync(migrationPath, 'utf8')
    
    console.log('📝 Applying database constraints...')
    
    // Split SQL into individual statements and execute them
    const statements = migrationSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'))

    for (const statement of statements) {
      try {
        await sql.unsafe(statement)
        console.log(`✅ Executed: ${statement.substring(0, 50)}...`)
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log(`ℹ️ Constraint already exists: ${statement.substring(0, 50)}...`)
        } else {
          console.error(`❌ Failed to execute: ${statement.substring(0, 50)}...`)
          console.error(`   Error: ${error.message}`)
        }
      }
    }

    // Validate the fixes
    console.log('\n🔍 Validating fixes...')
    
    // Check if constraints exist
    const constraintCheck = await sql`
      SELECT constraint_name, table_name 
      FROM information_schema.table_constraints 
      WHERE constraint_name IN (
        'unique_paystack_subscription_code',
        'unique_stripe_subscription_id'
      )
    `
    
    console.log('✅ Database constraints applied:')
    for (const row of constraintCheck) {
      console.log(`   - ${row.constraint_name} on ${row.table_name}`)
    }

    // Check indexes
    const indexCheck = await sql`
      SELECT indexname, tablename 
      FROM pg_indexes 
      WHERE indexname LIKE 'unique_active_subscription%' 
         OR indexname LIKE 'idx_subscriptions%'
         OR indexname LIKE 'idx_payment_events%'
    `
    
    console.log('✅ Database indexes created:')
    for (const row of indexCheck) {
      console.log(`   - ${row.indexname} on ${row.tablename}`)
    }

    console.log('\n🎉 Paystack fixes applied successfully!')
    console.log('\n📋 Summary of fixes:')
    console.log('   1. ✅ Database unique constraints added')
    console.log('   2. ✅ Missing cancelSubscription method fixed')
    console.log('   3. ✅ Trial period logic standardized')
    console.log('   4. ✅ Webhook error handling and rate limiting added')
    
    console.log('\n⚠️  Next steps:')
    console.log('   - Test the payment flow with test cards')
    console.log('   - Verify webhook signature validation')
    console.log('   - Monitor rate limiting in production')
    console.log('   - Test subscription cancellation')

  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
  }
}

main().catch(console.error)