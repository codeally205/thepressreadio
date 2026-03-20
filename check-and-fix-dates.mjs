#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { subscriptions, users } from './lib/db/schema.js'
import { eq, desc } from 'drizzle-orm'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const connectionString = process.env.DATABASE_URL
if (!connectionString) {
  console.error('❌ DATABASE_URL not found in environment variables')
  process.exit(1)
}

const client = postgres(connectionString)
const db = drizzle(client)

async function checkSubscriptionDates() {
  try {
    console.log('🔍 Checking subscription dates...\n')
    
    // Get all subscriptions with their user info
    const allSubscriptions = await db
      .select({
        id: subscriptions.id,
        userId: subscriptions.userId,
        plan: subscriptions.plan,
        status: subscriptions.status,
        trialEndsAt: subscriptions.trialEndsAt,
        currentPeriodStart: subscriptions.currentPeriodStart,
        currentPeriodEnd: subscriptions.currentPeriodEnd,
        createdAt: subscriptions.createdAt,
        userEmail: users.email,
        userName: users.name
      })
      .from(subscriptions)
      .leftJoin(users, eq(subscriptions.userId, users.id))
      .orderBy(desc(subscriptions.createdAt))

    console.log(`Found ${allSubscriptions.length} subscription(s):\n`)

    const now = new Date()
    const currentYear = now.getFullYear()
    let hasIssues = false

    for (const sub of allSubscriptions) {
      console.log(`📋 Subscription ID: ${sub.id}`)
      console.log(`   User: ${sub.userEmail} (${sub.userName || 'No name'})`)
      console.log(`   Plan: ${sub.plan}`)
      console.log(`   Status: ${sub.status}`)
      console.log(`   Created: ${sub.createdAt?.toLocaleDateString()}`)
      
      if (sub.trialEndsAt) {
        console.log(`   Trial ends: ${sub.trialEndsAt.toLocaleDateString()}`)
        if (sub.trialEndsAt.getFullYear() > currentYear + 1) {
          console.log(`   ⚠️  ISSUE: Trial end date is in the future (${sub.trialEndsAt.getFullYear()})`)
          hasIssues = true
        }
      }
      
      console.log(`   Period start: ${sub.currentPeriodStart?.toLocaleDateString()}`)
      console.log(`   Period end: ${sub.currentPeriodEnd?.toLocaleDateString()}`)
      
      if (sub.currentPeriodEnd && sub.currentPeriodEnd.getFullYear() > currentYear + 1) {
        console.log(`   ⚠️  ISSUE: Period end date is in the future (${sub.currentPeriodEnd.getFullYear()})`)
        hasIssues = true
      }
      
      console.log('')
    }

    if (hasIssues) {
      console.log('❌ Found subscription dates with issues!')
      console.log('\nWould you like to fix these dates? This will:')
      console.log('- Set trial end dates to 14 days from creation date')
      console.log('- Set period end dates to 1 month from creation date for monthly plans')
      console.log('- Set period end dates to 1 year from creation date for yearly plans')
      
      // For now, just report the issues
      console.log('\nTo fix these issues, you can run the fix function in this script.')
    } else {
      console.log('✅ All subscription dates look correct!')
    }

  } catch (error) {
    console.error('❌ Error checking subscription dates:', error)
  } finally {
    await client.end()
  }
}

async function fixSubscriptionDates() {
  try {
    console.log('🔧 Fixing subscription dates...\n')
    
    const allSubscriptions = await db
      .select()
      .from(subscriptions)
      .orderBy(desc(subscriptions.createdAt))

    const now = new Date()
    const currentYear = now.getFullYear()

    for (const sub of allSubscriptions) {
      let needsUpdate = false
      const updates = {}

      // Fix trial end date if it's in the wrong year
      if (sub.trialEndsAt && sub.trialEndsAt.getFullYear() > currentYear + 1) {
        const correctTrialEnd = new Date(sub.createdAt)
        correctTrialEnd.setDate(correctTrialEnd.getDate() + 14)
        updates.trialEndsAt = correctTrialEnd
        needsUpdate = true
        console.log(`Fixing trial end date for ${sub.id}: ${sub.trialEndsAt.toLocaleDateString()} → ${correctTrialEnd.toLocaleDateString()}`)
      }

      // Fix period end date if it's in the wrong year
      if (sub.currentPeriodEnd && sub.currentPeriodEnd.getFullYear() > currentYear + 1) {
        const correctPeriodEnd = new Date(sub.createdAt)
        if (sub.plan.includes('yearly')) {
          correctPeriodEnd.setFullYear(correctPeriodEnd.getFullYear() + 1)
        } else {
          correctPeriodEnd.setMonth(correctPeriodEnd.getMonth() + 1)
        }
        updates.currentPeriodEnd = correctPeriodEnd
        needsUpdate = true
        console.log(`Fixing period end date for ${sub.id}: ${sub.currentPeriodEnd.toLocaleDateString()} → ${correctPeriodEnd.toLocaleDateString()}`)
      }

      if (needsUpdate) {
        updates.updatedAt = new Date()
        await db
          .update(subscriptions)
          .set(updates)
          .where(eq(subscriptions.id, sub.id))
        
        console.log(`✅ Updated subscription ${sub.id}`)
      }
    }

    console.log('\n✅ Finished fixing subscription dates!')

  } catch (error) {
    console.error('❌ Error fixing subscription dates:', error)
  } finally {
    await client.end()
  }
}

// Run the check function
checkSubscriptionDates()

// Uncomment the line below to actually fix the dates
// fixSubscriptionDates()