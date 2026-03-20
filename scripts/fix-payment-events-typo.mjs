import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

console.log('🔧 Fixing payment_events table typo...\n')

const sql = postgres(connectionString)

async function fix() {
  try {
    // Check if the typo column exists
    const columns = await sql`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'payment_events'
      AND column_name IN ('subscriptioon_id', 'subscription_id')
    `
    
    console.log('Current columns:', columns.map(c => c.column_name))
    
    const hasTypo = columns.some(c => c.column_name === 'subscriptioon_id')
    const hasCorrect = columns.some(c => c.column_name === 'subscription_id')
    
    if (hasTypo && !hasCorrect) {
      console.log('\n📝 Renaming subscriptioon_id to subscription_id...')
      await sql`
        ALTER TABLE payment_events 
        RENAME COLUMN subscriptioon_id TO subscription_id
      `
      console.log('✅ Column renamed successfully')
    } else if (hasCorrect) {
      console.log('✅ Column name is already correct')
    } else {
      console.log('⚠️  Neither column exists, might need to add it')
    }
    
    // Verify the fix
    const finalColumns = await sql`
      SELECT column_name, data_type
      FROM information_schema.columns 
      WHERE table_name = 'payment_events'
      ORDER BY ordinal_position
    `
    
    console.log('\n📊 Final payment_events columns:')
    finalColumns.forEach(col => {
      console.log(`  - ${col.column_name} (${col.data_type})`)
    })
    
  } catch (error) {
    console.error('\n❌ Fix failed:', error)
    console.error('Error details:', error.message)
    process.exit(1)
  } finally {
    await sql.end()
    console.log('\n🔌 Database connection closed')
  }
}

fix()
