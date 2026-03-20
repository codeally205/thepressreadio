#!/usr/bin/env node

import { config } from 'dotenv'
import postgres from 'postgres'

config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const sql = postgres(connectionString)

async function debugSubscriptions() {
  try {
    console.log('🔍 Debugging Admin Dashboard Subscription Data...\n')
    
    // Test 1: Check all subscriptions
    console.log('📋 Test 1: All subscriptions in database')
    const allSubscriptions = await sql`
      SELECT 
        s.id,
        s.user_id,
        s.plan,
        s.status,
        s.current_period_end,
        s.payment_processor,
        s.created_at,
        u.email,
        u.name
      FROM subscriptions s
      LEFT JOIN "user" u ON s.user_id = u.id
      ORDER BY s.created_at DESC
    `
    
    console.log(`Found ${allSubscriptions.length} total subscriptions:`)
    allSubscriptions.forEach((sub, index) => {
      console.log(`  ${index + 1}. ${sub.email} - Plan: ${sub.plan}, Status: ${sub.status}`)
      console.log(`     Period End: ${sub.current_period_end}, Processor: ${sub.payment_processor}`)
    })
    
    // Test 2: Check what admin dashboard should show (active + future end date)
    console.log('\n📊 Test 2: Active subscriptions (what admin dashboard queries)')
    const now = new Date().toISOString()
    
    const activeSubscriptions = await sql`
      SELECT 
        plan,
        COUNT(*) as count
      FROM subscriptions 
      WHERE status = 'active' 
        AND current_period_end > ${now}
      GROUP BY plan
    `
    
    console.log('Active subscription stats (shown in admin dashboard):')
    if (activeSubscriptions.length === 0) {
      console.log('  ❌ No active subscriptions found')
      console.log('  This explains why admin dashboard shows no data')
    } else {
      activeSubscriptions.forEach(stat => {
        console.log(`  ${stat.plan}: ${stat.count} subscribers`)
      })
    }
    
    // Test 3: Status breakdown
    console.log('\n📈 Test 3: Subscription status breakdown')
    const statusBreakdown = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM subscriptions 
      GROUP BY status
    `
    
    console.log('Status breakdown:')
    statusBreakdown.forEach(stat => {
      console.log(`  ${stat.status}: ${stat.count}`)
    })
    
    // Test 4: Period end analysis
    console.log('\n📅 Test 4: Period end date analysis')
    
    const futureCount = await sql`
      SELECT COUNT(*) as count
      FROM subscriptions 
      WHERE current_period_end > ${now}
    `
    
    const pastCount = await sql`
      SELECT COUNT(*) as count
      FROM subscriptions 
      WHERE current_period_end <= ${now}
    `
    
    console.log(`Subscriptions with future end dates: ${futureCount[0].count}`)
    console.log(`Subscriptions with past end dates: ${pastCount[0].count}`)
    console.log(`Current time: ${now}`)
    
    // Test 5: Detailed analysis
    console.log('\n🔍 Test 5: Why each subscription doesn\'t show in admin dashboard')
    
    for (const sub of allSubscriptions) {
      const isActive = sub.status === 'active'
      const isFuture = new Date(sub.current_period_end) > new Date()
      const shouldShow = isActive && isFuture
      
      console.log(`\n${sub.email} (${sub.plan}):`)
      console.log(`  Status: ${sub.status} ${isActive ? '✅' : '❌'}`)
      console.log(`  Period End: ${sub.current_period_end} ${isFuture ? '✅' : '❌'}`)
      console.log(`  Shows in admin: ${shouldShow ? '✅ YES' : '❌ NO'}`)
      
      if (!shouldShow) {
        const reasons = []
        if (!isActive) reasons.push(`Status is '${sub.status}' (needs 'active')`)
        if (!isFuture) reasons.push('Period has ended')
        console.log(`  Reasons: ${reasons.join(', ')}`)
      }
    }
    
    // Test 6: Suggested fixes
    console.log('\n💡 Suggested fixes:')
    
    const trialingCount = await sql`
      SELECT COUNT(*) as count
      FROM subscriptions 
      WHERE status = 'trialing'
    `
    
    if (trialingCount[0].count > 0) {
      console.log(`  - Convert ${trialingCount[0].count} 'trialing' subscriptions to 'active'`)
    }
    
    const expiredCount = await sql`
      SELECT COUNT(*) as count
      FROM subscriptions 
      WHERE current_period_end <= ${now}
        AND created_at > ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
    `
    
    if (expiredCount[0].count > 0) {
      console.log(`  - Extend period end dates for ${expiredCount[0].count} recent subscriptions`)
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await sql.end()
  }
}

debugSubscriptions()