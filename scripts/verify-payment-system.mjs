import postgres from 'postgres'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

console.log('🔍 Payment System Health Check\n')
console.log('='.repeat(70))

const sql = postgres(connectionString)

async function verify() {
  const checks = {
    passed: 0,
    failed: 0,
    warnings: 0
  }

  try {
    // Check 1: Database Schema
    console.log('\n✓ Check 1: Database Schema')
    console.log('-'.repeat(70))
    
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions'
      ORDER BY column_name
    `
    
    const requiredColumns = [
      'upgraded_from_trial_id',
      'payment_reference',
      'paystack_customer_code',
      'stripe_subscription_id',
      'trial_ends_at',
      'status'
    ]
    
    const existingColumns = columns.map(c => c.column_name)
    const missingColumns = requiredColumns.filter(c => !existingColumns.includes(c))
    
    if (missingColumns.length === 0) {
      console.log('  ✅ All required columns exist')
      checks.passed++
    } else {
      console.log('  ❌ Missing columns:', missingColumns.join(', '))
      checks.failed++
    }

    // Check 2: Indexes
    console.log('\n✓ Check 2: Database Indexes')
    console.log('-'.repeat(70))
    
    const indexes = await sql`
      SELECT indexname 
      FROM pg_indexes 
      WHERE tablename = 'subscriptions'
      AND indexname LIKE 'idx_subscriptions_%'
    `
    
    const requiredIndexes = [
      'idx_subscriptions_payment_reference',
      'idx_subscriptions_trial_expiration',
      'idx_subscriptions_user_processor',
      'idx_subscriptions_status'
    ]
    
    const existingIndexes = indexes.map(i => i.indexname)
    const missingIndexes = requiredIndexes.filter(i => !existingIndexes.includes(i))
    
    if (missingIndexes.length === 0) {
      console.log('  ✅ All required indexes exist')
      checks.passed++
    } else {
      console.log('  ⚠️  Missing indexes:', missingIndexes.join(', '))
      checks.warnings++
    }

    // Check 3: Subscription Status
    console.log('\n✓ Check 3: Subscription Status')
    console.log('-'.repeat(70))
    
    const statusCheck = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'active') as active,
        COUNT(*) FILTER (WHERE status = 'trialing') as trialing,
        COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled,
        COUNT(*) FILTER (WHERE status = 'trialing' AND trial_ends_at < NOW()) as expired_trials
      FROM subscriptions
    `
    
    const stats = statusCheck[0]
    console.log(`  Total subscriptions: ${stats.total}`)
    console.log(`  Active: ${stats.active}`)
    console.log(`  Trialing: ${stats.trialing}`)
    console.log(`  Cancelled: ${stats.cancelled}`)
    
    if (parseInt(stats.expired_trials) > 0) {
      console.log(`  ⚠️  Expired trials: ${stats.expired_trials} (need cleanup)`)
      checks.warnings++
    } else {
      console.log(`  ✅ No expired trials`)
      checks.passed++
    }

    // Check 4: Duplicate Subscriptions
    console.log('\n✓ Check 4: Duplicate Subscriptions')
    console.log('-'.repeat(70))
    
    const duplicates = await sql`
      SELECT user_id, payment_processor, COUNT(*) as count
      FROM subscriptions
      WHERE status IN ('active', 'trialing')
      GROUP BY user_id, payment_processor
      HAVING COUNT(*) > 1
    `
    
    if (duplicates.length === 0) {
      console.log('  ✅ No duplicate subscriptions found')
      checks.passed++
    } else {
      console.log(`  ⚠️  Found ${duplicates.length} users with duplicate subscriptions`)
      checks.warnings++
    }

    // Check 5: Payment Events
    console.log('\n✓ Check 5: Payment Events (Last 7 Days)')
    console.log('-'.repeat(70))
    
    const events = await sql`
      SELECT 
        processor,
        event_type,
        COUNT(*) as count
      FROM payment_events
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY processor, event_type
      ORDER BY processor, count DESC
    `
    
    if (events.length > 0) {
      console.log('  Recent payment events:')
      events.forEach(e => {
        console.log(`    ${e.processor.padEnd(10)} | ${e.event_type.padEnd(30)} | ${e.count}`)
      })
      checks.passed++
    } else {
      console.log('  ℹ️  No payment events in last 7 days')
      checks.passed++
    }

    // Check 6: Webhook Processing
    console.log('\n✓ Check 6: Webhook Processing')
    console.log('-'.repeat(70))
    
    const webhookCheck = await sql`
      SELECT 
        processor,
        COUNT(*) as total_events,
        COUNT(DISTINCT processor_event_id) as unique_events
      FROM payment_events
      WHERE created_at > NOW() - INTERVAL '30 days'
      GROUP BY processor
    `
    
    let webhookHealthy = true
    webhookCheck.forEach(w => {
      const duplicateRate = ((w.total_events - w.unique_events) / w.total_events * 100).toFixed(1)
      console.log(`  ${w.processor}: ${w.total_events} events, ${w.unique_events} unique (${duplicateRate}% duplicates)`)
      
      if (parseFloat(duplicateRate) > 5) {
        webhookHealthy = false
      }
    })
    
    if (webhookHealthy) {
      console.log('  ✅ Webhook processing looks healthy')
      checks.passed++
    } else {
      console.log('  ⚠️  High duplicate rate detected')
      checks.warnings++
    }

    // Check 7: Environment Variables
    console.log('\n✓ Check 7: Environment Variables')
    console.log('-'.repeat(70))
    
    const requiredEnvVars = [
      'DATABASE_URL',
      'PAYSTACK_SECRET_KEY',
      'STRIPE_SECRET_KEY',
      'STRIPE_WEBHOOK_SECRET',
      'NEXTAUTH_URL',
      'NEXTAUTH_SECRET',
      'CRON_SECRET'
    ]
    
    const missingEnvVars = requiredEnvVars.filter(v => !process.env[v])
    
    if (missingEnvVars.length === 0) {
      console.log('  ✅ All required environment variables are set')
      checks.passed++
    } else {
      console.log('  ❌ Missing environment variables:', missingEnvVars.join(', '))
      checks.failed++
    }

    // Check 8: Cron Job Configuration
    console.log('\n✓ Check 8: Cron Job Configuration')
    console.log('-'.repeat(70))
    
    try {
      const fs = await import('fs')
      const vercelConfig = JSON.parse(fs.readFileSync('vercel.json', 'utf8'))
      
      if (vercelConfig.crons && vercelConfig.crons.length > 0) {
        console.log('  ✅ Cron jobs configured in vercel.json:')
        vercelConfig.crons.forEach(cron => {
          console.log(`    - ${cron.path} (${cron.schedule})`)
        })
        checks.passed++
      } else {
        console.log('  ⚠️  No cron jobs configured in vercel.json')
        checks.warnings++
      }
    } catch (error) {
      console.log('  ⚠️  Could not read vercel.json')
      checks.warnings++
    }

    // Summary
    console.log('\n' + '='.repeat(70))
    console.log('📊 Health Check Summary')
    console.log('='.repeat(70))
    
    const total = checks.passed + checks.failed + checks.warnings
    console.log(`Total Checks: ${total}`)
    console.log(`✅ Passed: ${checks.passed}`)
    console.log(`⚠️  Warnings: ${checks.warnings}`)
    console.log(`❌ Failed: ${checks.failed}`)
    
    console.log('\n' + '='.repeat(70))
    
    if (checks.failed === 0 && checks.warnings === 0) {
      console.log('🎉 All checks passed! Payment system is healthy.')
      console.log('✅ Ready for production')
    } else if (checks.failed === 0) {
      console.log('⚠️  System is functional but has warnings.')
      console.log('📝 Review warnings above and address if needed.')
    } else {
      console.log('❌ Critical issues found!')
      console.log('🔧 Fix failed checks before deploying to production.')
    }
    
    console.log('='.repeat(70))

    // Recommendations
    if (checks.warnings > 0 || checks.failed > 0) {
      console.log('\n💡 Recommendations:')
      
      if (parseInt(stats.expired_trials) > 0) {
        console.log('  • Run: node scripts/cleanup-expired-trials.mjs')
      }
      
      if (duplicates.length > 0) {
        console.log('  • Review and consolidate duplicate subscriptions')
      }
      
      if (missingEnvVars.length > 0) {
        console.log('  • Set missing environment variables')
      }
      
      if (missingIndexes.length > 0) {
        console.log('  • Run: node scripts/migrate-add-fields.mjs')
      }
    }

  } catch (error) {
    console.error('\n❌ Health check failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
    console.log('\n🔌 Database connection closed\n')
  }
}

verify()
