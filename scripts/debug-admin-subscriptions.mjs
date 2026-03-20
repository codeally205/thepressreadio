#!/usr/bin/env node

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { subscriptions, users } from '../lib/db/schema.js'
import { eq, count, and, gt, desc } from 'drizzle-orm'

config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function debugAdminSubscriptions() {
  try {
    console.log('🔍 Debugging Admin Dashboard Subscription Data...\n')
    
    // Test 1: Check all subscriptions
    console.log('📋 Test 1: All subscriptions in database')
    const allSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        paymentProcessor: subscriptions.paymentProcessor,
        createdAt: subscriptions.createdAt
      })
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt))
    
    console.log(`Found ${allSubscriptions.length} total subscriptions:`)
    allSubscriptions.forEach((sub, index) => {
      console.log(`  ${index + 1}. Plan: ${sub.plan}, Status: ${sub.status}, Processor: ${sub.paymentProcessor}`)
      console.log(`     Period End: ${sub.currentPeriodEnd}, Created: ${sub.createdAt}`)
    })
    
    // Test 2: Check active subscriptions (what admin dashboard should show)
    console.log('\n📊 Test 2: Active subscriptions (admin dashboard query)')
    const activeSubscriptions = await db
      .select({
        plan: subscriptions.plan,
        count: count()
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          gt(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .groupBy(subscriptions.plan)
    
    console.log('Active subscription stats:')
    if (activeSubscriptions.length === 0) {
      console.log('  ❌ No active subscriptions found')
      console.log('  This explains why admin dashboard shows no data')
    } else {
      activeSubscriptions.forEach(stat => {
        console.log(`  ${stat.plan}: ${stat.count} subscribers`)
      })
    }
    
    // Test 3: Check subscription statuses
    console.log('\n📈 Test 3: Subscription status breakdown')
    const statusBreakdown = await db
      .select({
        status: subscriptions.status,
        count: count()
      })
      .from(subscriptions)
      .groupBy(subscriptions.status)
    
    console.log('Status breakdown:')
    statusBreakdown.forEach(stat => {
      console.log(`  ${stat.status}: ${stat.count}`)
    })
    
    // Test 4: Check period end dates
    console.log('\n📅 Test 4: Period end date analysis')
    const now = new Date()
    const futureSubscriptions = await db
      .select({
        count: count()
      })
      .from(subscriptions)
      .where(gt(subscriptions.currentPeriodEnd, now))
    
    const pastSubscriptions = await db
      .select({
        count: count()
      })
      .from(subscriptions)
      .where(and(
        subscriptions.currentPeriodEnd !== null,
        subscriptions.currentPeriodEnd <= now
      ))
    
    console.log(`Subscriptions with future end dates: ${futureSubscriptions[0]?.count || 0}`)
    console.log(`Subscriptions with past end dates: ${pastSubscriptions[0]?.count || 0}`)
    console.log(`Current time: ${now.toISOString()}`)
    
    // Test 5: Check specific subscription details
    if (allSubscriptions.length > 0) {
      console.log('\n🔍 Test 5: Detailed subscription analysis')
      for (const sub of allSubscriptions) {
        const user = await db
          .select({ email: users.email, name: users.name })
          .from(users)
          .where(eq(users.id, sub.userId))
          .limit(1)
        
        const isActive = sub.status === 'active'
        const isFuture = sub.currentPeriodEnd > now
        const shouldShowInAdmin = isActive && isFuture
        
        console.log(`\nSubscription ${sub.id}:`)
        console.log(`  User: ${user[0]?.email || 'Unknown'} (${user[0]?.name || 'No name'})`)
        console.log(`  Plan: ${sub.plan}`)
        console.log(`  Status: ${sub.status} ${isActive ? '✅' : '❌'}`)
        console.log(`  Period End: ${sub.currentPeriodEnd} ${isFuture ? '✅' : '❌'}`)
        console.log(`  Should show in admin: ${shouldShowInAdmin ? '✅ YES' : '❌ NO'}`)
        
        if (!shouldShowInAdmin) {
          if (!isActive) {
            console.log(`  ⚠️  Not active (status: ${sub.status})`)
          }
          if (!isFuture) {
            console.log(`  ⚠️  Period ended (${sub.currentPeriodEnd})`)
          }
        }
      }
    }
    
    // Test 6: Simulate admin dashboard queries
    console.log('\n🎯 Test 6: Simulating admin dashboard queries')
    
    // DashboardStats query
    const activeSubsCount = await db
      .select({ count: count() })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          gt(subscriptions.currentPeriodEnd, new Date())
        )
      )
    
    console.log(`DashboardStats active subscriptions: ${activeSubsCount[0]?.count || 0}`)
    
    // SubscriberStats query
    const planStats = await db
      .select({
        plan: subscriptions.plan,
        count: count()
      })
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          gt(subscriptions.currentPeriodEnd, new Date())
        )
      )
      .groupBy(subscriptions.plan)
    
    console.log('SubscriberStats plan breakdown:')
    if (planStats.length === 0) {
      console.log('  No data (explains empty admin dashboard)')
    } else {
      planStats.forEach(stat => {
        console.log(`  ${stat.plan}: ${stat.count}`)
      })
    }
    
  } catch (error) {
    console.error('❌ Error:', error)
  } finally {
    await client.end()
  }
}

debugAdminSubscriptions()