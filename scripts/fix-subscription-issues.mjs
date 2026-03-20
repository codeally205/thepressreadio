#!/usr/bin/env node

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { subscriptions } from '../lib/db/schema.js'
import { eq, and, lt } from 'drizzle-orm'

config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function fixSubscriptionIssues() {
  try {
    console.log('🔧 Fixing common subscription issues...\n')
    
    // Fix 1: Update trialing subscriptions that should be active
    console.log('🔍 Fix 1: Checking trialing subscriptions...')
    const now = new Date()
    
    const trialingSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'trialing'),
          subscriptions.trialEndsAt !== null,
          lt(subscriptions.trialEndsAt, now)
        )
      )
    
    console.log(`Found ${trialingSubscriptions.length} expired trials`)
    
    if (trialingSubscriptions.length > 0) {
      // Update expired trials to active (assuming they should continue)
      const updated = await db
        .update(subscriptions)
        .set({
          status: 'active',
          updatedAt: now
        })
        .where(
          and(
            eq(subscriptions.status, 'trialing'),
            subscriptions.trialEndsAt !== null,
            lt(subscriptions.trialEndsAt, now)
          )
        )
        .returning({ id: subscriptions.id })
      
      console.log(`✅ Updated ${updated.length} expired trials to active status`)
    }
    
    // Fix 2: Extend period end dates for recent subscriptions
    console.log('\n🔍 Fix 2: Checking recent subscriptions with past end dates...')
    
    const recentPastSubscriptions = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          subscriptions.currentPeriodEnd !== null,
          lt(subscriptions.currentPeriodEnd, now),
          // Only fix subscriptions created in the last 7 days
          subscriptions.createdAt >= new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        )
      )
    
    console.log(`Found ${recentPastSubscriptions.length} recent subscriptions with past end dates`)
    
    for (const sub of recentPastSubscriptions) {
      // Extend period based on plan
      const newEndDate = new Date()
      if (sub.plan.includes('yearly')) {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1)
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 1)
      }
      
      await db
        .update(subscriptions)
        .set({
          currentPeriodEnd: newEndDate,
          status: 'active', // Ensure it's active
          updatedAt: now
        })
        .where(eq(subscriptions.id, sub.id))
      
      console.log(`✅ Extended subscription ${sub.id} (${sub.plan}) to ${newEndDate.toISOString()}`)
    }
    
    // Fix 3: Create missing trial periods
    console.log('\n🔍 Fix 3: Adding trial periods to subscriptions without them...')
    
    const subscriptionsWithoutTrial = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'active'),
          subscriptions.trialEndsAt === null
        )
      )
    
    console.log(`Found ${subscriptionsWithoutTrial.length} active subscriptions without trial info`)
    
    for (const sub of subscriptionsWithoutTrial) {
      // Add a trial period that started when subscription was created
      const trialStart = sub.createdAt
      const trialEnd = new Date(trialStart)
      trialEnd.setDate(trialEnd.getDate() + 14)
      
      await db
        .update(subscriptions)
        .set({
          trialEndsAt: trialEnd,
          updatedAt: now
        })
        .where(eq(subscriptions.id, sub.id))
      
      console.log(`✅ Added trial period to subscription ${sub.id}`)
    }
    
    console.log('\n🎉 Subscription fixes completed!')
    console.log('💡 Run the debug script to verify changes: node scripts/debug-admin-subscriptions.mjs')
    
  } catch (error) {
    console.error('❌ Error fixing subscriptions:', error)
  } finally {
    await client.end()
  }
}

fixSubscriptionIssues()