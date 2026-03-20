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

async function fixSubscriptions() {
  try {
    console.log('🔧 Fixing subscription issues for admin dashboard...\n')
    
    const now = new Date()
    const nowISO = now.toISOString()
    
    // Fix 1: Convert trialing to active
    console.log('🔍 Fix 1: Converting trialing subscriptions to active...')
    
    const trialingSubscriptions = await sql`
      SELECT id, plan, user_id, trial_ends_at
      FROM subscriptions 
      WHERE status = 'trialing'
    `
    
    console.log(`Found ${trialingSubscriptions.length} trialing subscriptions`)
    
    if (trialingSubscriptions.length > 0) {
      const updated = await sql`
        UPDATE subscriptions 
        SET status = 'active', updated_at = ${nowISO}
        WHERE status = 'trialing'
        RETURNING id
      `
      
      console.log(`✅ Updated ${updated.length} subscriptions from 'trialing' to 'active'`)
    }
    
    // Fix 2: Extend period end dates for recent subscriptions
    console.log('\n🔍 Fix 2: Extending period end dates for recent subscriptions...')
    
    const recentExpired = await sql`
      SELECT id, plan, current_period_end, created_at
      FROM subscriptions 
      WHERE current_period_end <= ${nowISO}
        AND created_at > ${new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()}
    `
    
    console.log(`Found ${recentExpired.length} recent subscriptions with past end dates`)
    
    for (const sub of recentExpired) {
      // Calculate new end date based on plan
      const newEndDate = new Date()
      if (sub.plan.includes('yearly')) {
        newEndDate.setFullYear(newEndDate.getFullYear() + 1)
      } else {
        newEndDate.setMonth(newEndDate.getMonth() + 1)
      }
      
      await sql`
        UPDATE subscriptions 
        SET 
          current_period_end = ${newEndDate.toISOString()},
          status = 'active',
          updated_at = ${nowISO}
        WHERE id = ${sub.id}
      `
      
      console.log(`✅ Extended subscription ${sub.id} (${sub.plan}) to ${newEndDate.toLocaleDateString()}`)
    }
    
    // Fix 3: Add trial periods where missing
    console.log('\n🔍 Fix 3: Adding missing trial periods...')
    
    const withoutTrial = await sql`
      SELECT id, created_at
      FROM subscriptions 
      WHERE trial_ends_at IS NULL
        AND status = 'active'
    `
    
    console.log(`Found ${withoutTrial.length} subscriptions without trial info`)
    
    for (const sub of withoutTrial) {
      const trialEnd = new Date(sub.created_at)
      trialEnd.setDate(trialEnd.getDate() + 14)
      
      await sql`
        UPDATE subscriptions 
        SET 
          trial_ends_at = ${trialEnd.toISOString()},
          updated_at = ${nowISO}
        WHERE id = ${sub.id}
      `
      
      console.log(`✅ Added trial period to subscription ${sub.id}`)
    }
    
    // Verify fixes
    console.log('\n🎯 Verification: Checking admin dashboard query results...')
    
    const activeAfterFix = await sql`
      SELECT 
        plan,
        COUNT(*) as count
      FROM subscriptions 
      WHERE status = 'active' 
        AND current_period_end > ${nowISO}
      GROUP BY plan
    `
    
    console.log('Active subscriptions that will show in admin dashboard:')
    if (activeAfterFix.length === 0) {
      console.log('  ❌ Still no active subscriptions - may need manual intervention')
    } else {
      let total = 0
      activeAfterFix.forEach(stat => {
        console.log(`  ${stat.plan}: ${stat.count} subscribers`)
        total += parseInt(stat.count)
      })
      console.log(`  Total: ${total} active subscriptions`)
      console.log('  ✅ Admin dashboard should now show subscription data!')
    }
    
    console.log('\n🎉 Subscription fixes completed!')
    console.log('🔄 Refresh your admin dashboard to see the changes')
    
  } catch (error) {
    console.error('❌ Error fixing subscriptions:', error)
  } finally {
    await sql.end()
  }
}

fixSubscriptions()