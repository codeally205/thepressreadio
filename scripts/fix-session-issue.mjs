import postgres from 'postgres'
import * as dotenv from 'dotenv'

dotenv.config()

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL is not set')
  process.exit(1)
}

console.log('🔧 Fixing Session Issues...\n')

const sql = postgres(connectionString)

async function fix() {
  try {
    // Clean up old sessions with invalid user IDs
    console.log('1. Cleaning up invalid sessions...')
    
    const invalidSessions = await sql`
      DELETE FROM session
      WHERE "userId" NOT IN (SELECT id FROM "user")
      RETURNING "sessionToken"
    `
    
    if (invalidSessions.length > 0) {
      console.log(`✅ Removed ${invalidSessions.length} invalid session(s)`)
    } else {
      console.log('✅ No invalid sessions found')
    }

    // Show current valid sessions
    console.log('\n2. Current valid sessions:')
    const validSessions = await sql`
      SELECT 
        s."sessionToken",
        s.expires,
        u.email,
        u.name
      FROM session s
      JOIN "user" u ON s."userId" = u.id
      WHERE s.expires > NOW()
      ORDER BY s.expires DESC
    `
    
    if (validSessions.length > 0) {
      console.log('Valid sessions:')
      validSessions.forEach(s => {
        const expiresIn = Math.round((new Date(s.expires) - new Date()) / (1000 * 60 * 60 * 24))
        console.log(`  - ${s.email} (expires in ${expiresIn} days)`)
      })
    } else {
      console.log('ℹ️  No active sessions (you need to log in)')
    }

    // Show users who can log in
    console.log('\n3. Users available for login:')
    const users = await sql`
      SELECT email, name, auth_provider, created_at
      FROM "user"
      ORDER BY created_at DESC
    `
    
    users.forEach(u => {
      console.log(`  - ${u.email} (${u.auth_provider})`)
    })

    console.log('\n✅ Session cleanup complete!')
    console.log('\n📝 Next steps:')
    console.log('   1. Restart your Next.js dev server (Ctrl+C, then npm run dev)')
    console.log('   2. Clear browser cookies for localhost:3000')
    console.log('   3. Log in with one of the users listed above')
    console.log('   4. Try the payment flow again')

  } catch (error) {
    console.error('\n❌ Fix failed:', error)
    console.error('Error details:', error.message)
  } finally {
    await sql.end()
    console.log('\n🔌 Database connection closed')
  }
}

fix()
