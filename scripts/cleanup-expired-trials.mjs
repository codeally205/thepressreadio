import postgres from 'postgres'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

console.log('🔄 Cleaning up expired trials...\n')

const sql = postgres(connectionString)

async function cleanup() {
  try {
    const now = new Date()
    
    // Find expired trials
    const expiredTrials = await sql`
      SELECT 
        s.id,
        s.user_id,
        s.plan,
        s.status,
        s.trial_ends_at,
        u.email,
        u.name
      FROM subscriptions s
      JOIN "user" u ON s.user_id = u.id
      WHERE s.status = 'trialing'
      AND s.trial_ends_at < ${now}
      ORDER BY s.trial_ends_at
    `

    if (expiredTrials.length === 0) {
      console.log('✅ No expired trials found!')
      return
    }

    console.log(`Found ${expiredTrials.length} expired trial(s):\n`)
    
    expiredTrials.forEach((trial, index) => {
      const daysExpired = Math.floor((now - trial.trial_ends_at) / (1000 * 60 * 60 * 24))
      console.log(`${index + 1}. User: ${trial.email}`)
      console.log(`   Plan: ${trial.plan}`)
      console.log(`   Trial ended: ${trial.trial_ends_at.toISOString().split('T')[0]} (${daysExpired} days ago)`)
      console.log(`   Subscription ID: ${trial.id}`)
      console.log('')
    })

    // Ask for confirmation (in production, you might want to auto-process)
    console.log('⚠️  These trials will be marked as cancelled.\n')
    
    // Update expired trials
    const result = await sql`
      UPDATE subscriptions
      SET 
        status = 'cancelled',
        cancelled_at = ${now},
        updated_at = ${now}
      WHERE status = 'trialing'
      AND trial_ends_at < ${now}
      RETURNING id, user_id, plan
    `

    console.log(`✅ Successfully cancelled ${result.length} expired trial(s)`)
    
    result.forEach((sub, index) => {
      console.log(`   ${index + 1}. Subscription ${sub.id.substring(0, 8)}... (${sub.plan})`)
    })

    // Show updated status
    console.log('\n📊 Updated subscription status:')
    const statusCheck = await sql`
      SELECT 
        status,
        COUNT(*) as count
      FROM subscriptions
      GROUP BY status
      ORDER BY status
    `
    
    statusCheck.forEach(row => {
      console.log(`   ${row.status.padEnd(12)}: ${row.count}`)
    })

  } catch (error) {
    console.error('\n❌ Cleanup failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
    console.log('\n🔌 Database connection closed')
  }
}

cleanup()
