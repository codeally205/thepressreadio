import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

console.log('🔍 Checking Database State...\n')

const sql = postgres(connectionString)

async function check() {
  try {
    // Check if columns exist
    console.log('1. Checking subscriptions table columns...')
    const columns = await sql`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'subscriptions'
      ORDER BY ordinal_position
    `
    
    console.log('Columns in subscriptions table:')
    columns.forEach(col => {
      const marker = ['upgraded_from_trial_id', 'payment_reference'].includes(col.column_name) ? '✅ NEW' : ''
      console.log(`  - ${col.column_name.padEnd(30)} ${col.data_type.padEnd(20)} ${marker}`)
    })

    // Check user table name
    console.log('\n2. Checking user table...')
    const userTable = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name LIKE '%user%'
    `
    
    console.log('User-related tables:')
    userTable.forEach(t => console.log(`  - ${t.table_name}`))

    // Check foreign key constraints
    console.log('\n3. Checking foreign key constraints...')
    const fks = await sql`
      SELECT
        tc.constraint_name,
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
      AND tc.table_name = 'subscriptions'
    `
    
    console.log('Foreign keys on subscriptions:')
    fks.forEach(fk => {
      console.log(`  - ${fk.column_name} → ${fk.foreign_table_name}.${fk.foreign_column_name}`)
    })

    // Check if user exists
    console.log('\n4. Checking if user exists...')
    const userCheck = await sql`
      SELECT id, email, name 
      FROM "user" 
      WHERE id = '7a92ae9f-be6a-4b88-ac69-4d8084a1c567'
    `
    
    if (userCheck.length > 0) {
      console.log('✅ User found:', userCheck[0].email)
    } else {
      console.log('❌ User NOT found with that ID')
      
      // Check all users
      const allUsers = await sql`
        SELECT id, email, name 
        FROM "user" 
        LIMIT 5
      `
      console.log('\nExisting users:')
      allUsers.forEach(u => {
        console.log(`  - ${u.email} (${u.id})`)
      })
    }

    // Check subscriptions
    console.log('\n5. Checking existing subscriptions...')
    const subs = await sql`
      SELECT 
        s.id,
        s.user_id,
        s.plan,
        s.status,
        u.email
      FROM subscriptions s
      LEFT JOIN "user" u ON s.user_id = u.id
      ORDER BY s.created_at DESC
      LIMIT 5
    `
    
    console.log('Recent subscriptions:')
    subs.forEach(s => {
      console.log(`  - ${s.email || 'NO USER'} | ${s.plan} | ${s.status}`)
    })

  } catch (error) {
    console.error('\n❌ Check failed:', error)
    console.error('Error details:', error.message)
  } finally {
    await sql.end()
    console.log('\n🔌 Database connection closed')
  }
}

check()
