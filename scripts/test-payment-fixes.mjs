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

console.log('🧪 Testing Payment System Fixes\n')
console.log('=' .repeat(60))

const client = postgres(connectionString)
const db = drizzle(client)

async function runTests() {
  try {
    // Test 1: Check if new fields exist
    console.log('\n📋 Test 1: Verify Database Schema')
    console.log('-'.repeat(60))
    
    const schemaCheck = await db.execute(sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions' 
      AND column_name IN ('upgraded_from_trial_id', 'payment_reference', 'paystack_customer_code')
      ORDER BY column_name
    `)
    
    if (schemaCheck.length >= 2) {
      console.log('✅ New fields exist in database:')
      schemaCheck.forEach(col => {
        console.log(`   - ${col.column_name} (${col.data_type})`)
      })
    } else {
      console.log('❌ Missing fields! Run migration first:')
      console.log('   node scripts/run-subscription-migration.mjs')
      return
    }

    // Test 2: Check for problematic subscriptions
    console.log('\n📋 Test 2: Identify Problematic Subscriptions')
    console.log('-'.repeat(60))
    
    const problemSubs = await db.execute(sql`
      SELECT 
        id,
        user_id,
        plan,
        status,
        payment_processor,
        paystack_customer_code,
        payment_reference,
        trial_ends_at,
        created_at
      FROM subscriptions
      WHERE 
        (status = 'trialing' AND trial_ends_at < NOW()) OR
        (status = 'trialing' AND payment_processor = 'paystack' AND paystack_customer_code IS NULL)
      ORDER BY created_at DESC
      LIMIT 10
    `)
    
    if (problemSubs.length > 0) {
      console.log(`⚠️  Found ${problemSubs.length} subscriptions needing attention:`)
      problemSubs.forEach(sub => {
        const issues = []
        if (sub.trial_ends_at && new Date(sub.trial_ends_at) < new Date()) {
          issues.push('EXPIRED TRIAL')
        }
        if (sub.payment_processor === 'paystack' && !sub.paystack_customer_code) {
          issues.push('MISSING CUSTOMER CODE')
        }
        console.log(`   - ${sub.id.substring(0, 8)}... | ${sub.status} | ${sub.plan} | Issues: ${issues.join(', ')}`)
      })
    } else {
      console.log('✅ No problematic subscriptions found')
    }

    // Test 3: Check subscription status distribution
    console.log('\n📋 Test 3: Subscription Status Distribution')
    console.log('-'.repeat(60))
    
    const statusDist = await db.execute(sql`
      SELECT 
        status,
        payment_processor,
        COUNT(*) as count
      FROM subscriptions
      GROUP BY status, payment_processor
      ORDER BY payment_processor, status
    `)
    
    console.log('Current subscription breakdown:')
    statusDist.forEach(row => {
      console.log(`   ${row.payment_processor.padEnd(10)} | ${row.status.padEnd(12)} | ${row.count} subscriptions`)
    })

    // Test 4: Check for duplicate subscriptions
    console.log('\n📋 Test 4: Check for Duplicate Subscriptions')
    console.log('-'.repeat(60))
    
    const duplicates = await db.execute(sql`
      SELECT 
        user_id,
        payment_processor,
        COUNT(*) as subscription_count
      FROM subscriptions
      WHERE status IN ('active', 'trialing')
      GROUP BY user_id, payment_processor
      HAVING COUNT(*) > 1
    `)
    
    if (duplicates.length > 0) {
      console.log(`⚠️  Found ${duplicates.length} users with duplicate subscriptions:`)
      duplicates.forEach(dup => {
        console.log(`   - User: ${dup.user_id.substring(0, 8)}... | ${dup.payment_processor} | ${dup.subscription_count} subscriptions`)
      })
    } else {
      console.log('✅ No duplicate subscriptions found')
    }

    // Test 5: Check payment events
    console.log('\n📋 Test 5: Recent Payment Events')
    console.log('-'.repeat(60))
    
    const recentEvents = await db.execute(sql`
      SELECT 
        processor,
        event_type,
        COUNT(*) as count,
        MAX(created_at) as last_event
      FROM payment_events
      WHERE created_at > NOW() - INTERVAL '7 days'
      GROUP BY processor, event_type
      ORDER BY processor, event_type
    `)
    
    if (recentEvents.length > 0) {
      console.log('Payment events in last 7 days:')
      recentEvents.forEach(event => {
        console.log(`   ${event.processor.padEnd(10)} | ${event.event_type.padEnd(25)} | ${event.count} events`)
      })
    } else {
      console.log('ℹ️  No payment events in the last 7 days')
    }

    // Test 6: Check indexes
    console.log('\n📋 Test 6: Verify Indexes')
    console.log('-'.repeat(60))
    
    const indexes = await db.execute(sql`
      SELECT indexname, indexdef
      FROM pg_indexes
      WHERE tablename = 'subscriptions'
      AND indexname LIKE 'idx_subscriptions_%'
      ORDER BY indexname
    `)
    
    const expectedIndexes = [
      'idx_subscriptions_payment_reference',
      'idx_subscriptions_trial_expiration',
      'idx_subscriptions_user_processor',
      'idx_subscriptions_status'
    ]
    
    const foundIndexes = indexes.map(idx => idx.indexname)
    const missingIndexes = expectedIndexes.filter(idx => !foundIndexes.includes(idx))
    
    if (missingIndexes.length === 0) {
      console.log('✅ All required indexes exist:')
      foundIndexes.forEach(idx => console.log(`   - ${idx}`))
    } else {
      console.log('⚠️  Missing indexes:')
      missingIndexes.forEach(idx => console.log(`   - ${idx}`))
    }

    // Test 7: Recommendations
    console.log('\n📋 Test 7: Recommendations')
    console.log('-'.repeat(60))
    
    const recommendations = []
    
    if (problemSubs.length > 0) {
      recommendations.push('Run expire-trials cron job to clean up expired trials')
    }
    
    if (duplicates.length > 0) {
      recommendations.push('Review and consolidate duplicate subscriptions')
    }
    
    const orphanedPayments = await db.execute(sql`
      SELECT COUNT(*) as count
      FROM payment_events
      WHERE processor = 'paystack' 
      AND event_type = 'charge.success'
      AND created_at > NOW() - INTERVAL '30 days'
      AND user_id IS NULL
    `)
    
    if (parseInt(orphanedPayments[0].count) > 0) {
      recommendations.push(`${orphanedPayments[0].count} payment events without user_id - investigate webhook processing`)
    }
    
    if (recommendations.length > 0) {
      console.log('⚠️  Action items:')
      recommendations.forEach((rec, i) => {
        console.log(`   ${i + 1}. ${rec}`)
      })
    } else {
      console.log('✅ No immediate action items')
    }

    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 Test Summary')
    console.log('='.repeat(60))
    
    const totalSubs = await db.execute(sql`SELECT COUNT(*) as count FROM subscriptions`)
    const activeSubs = await db.execute(sql`SELECT COUNT(*) as count FROM subscriptions WHERE status IN ('active', 'trialing')`)
    
    console.log(`Total subscriptions: ${totalSubs[0].count}`)
    console.log(`Active/Trialing: ${activeSubs[0].count}`)
    console.log(`Issues found: ${problemSubs.length + duplicates.length}`)
    console.log(`Recommendations: ${recommendations.length}`)
    
    if (problemSubs.length === 0 && duplicates.length === 0 && recommendations.length === 0) {
      console.log('\n✅ All tests passed! Payment system looks healthy.')
    } else {
      console.log('\n⚠️  Some issues found. Review recommendations above.')
    }

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    process.exit(1)
  } finally {
    await client.end()
    console.log('\n🔌 Database connection closed')
  }
}

runTests()
