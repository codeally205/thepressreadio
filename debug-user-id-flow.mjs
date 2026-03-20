import { drizzle } from 'drizzle-orm/neon-serverless'
import { neon } from '@neondatabase/serverless'
import { eq, like, desc } from 'drizzle-orm'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql)

async function debugUserIdFlow() {
  console.log('🔍 Debugging User ID Flow\n')
  
  // The problematic user ID from the error
  const problematicUserId = '0411e341-ed5f-4543-8b0d-c6dcef2881a1'
  
  console.log('1️⃣ Checking if user exists in database...')
  const userResult = await sql`
    SELECT id, email, name, auth_provider, role, created_at 
    FROM "user" 
    WHERE id = ${problematicUserId}
  `
  
  if (userResult.length > 0) {
    const user = userResult[0]
    console.log('✅ User EXISTS in database:')
    console.log({
      id: user.id,
      email: user.email,
      name: user.name,
      authProvider: user.auth_provider,
      role: user.role,
      createdAt: user.created_at,
    })
  } else {
    console.log('❌ User NOT FOUND in database')
    console.log('User ID:', problematicUserId)
  }
  
  console.log('\n2️⃣ Checking all users in database...')
  const allUsers = await sql`
    SELECT id, email, name, auth_provider, created_at 
    FROM "user" 
    ORDER BY created_at DESC 
    LIMIT 10
  `
  
  console.log(`Found ${allUsers.length} users (showing last 10):`)
  allUsers.forEach((u, i) => {
    console.log(`${i + 1}. ${u.email} - ID: ${u.id} - Provider: ${u.auth_provider} - Created: ${u.created_at}`)
  })
  
  console.log('\n3️⃣ Checking payment events with this user ID...')
  const paymentEvents = await sql`
    SELECT id, event_type, processor, status, metadata, created_at
    FROM payment_events 
    WHERE metadata::text LIKE ${'%' + problematicUserId + '%'}
    ORDER BY created_at DESC 
    LIMIT 5
  `
  
  if (paymentEvents.length > 0) {
    console.log(`Found ${paymentEvents.length} payment events:`)
    paymentEvents.forEach((event, i) => {
      console.log(`${i + 1}. ${event.event_type} - ${event.processor} - ${event.status}`)
      console.log('   Metadata:', JSON.stringify(event.metadata, null, 2))
    })
  } else {
    console.log('No payment events found with this user ID')
  }
  
  console.log('\n4️⃣ Checking subscriptions for this user ID...')
  const subscriptions = await sql`
    SELECT id, plan, status, payment_processor, created_at
    FROM subscriptions 
    WHERE user_id = ${problematicUserId}
  `
  
  if (subscriptions.length > 0) {
    console.log(`Found ${subscriptions.length} subscriptions:`)
    subscriptions.forEach((sub, i) => {
      console.log(`${i + 1}. Plan: ${sub.plan} - Status: ${sub.status} - Processor: ${sub.payment_processor}`)
    })
  } else {
    console.log('No subscriptions found for this user ID')
  }
  
  console.log('\n5️⃣ Checking sessions for this user ID...')
  const sessions = await sql`
    SELECT "sessionToken", expires
    FROM session 
    WHERE "userId" = ${problematicUserId}
  `
  
  if (sessions.length > 0) {
    console.log(`Found ${sessions.length} sessions:`)
    sessions.forEach((session, i) => {
      console.log(`${i + 1}. Token: ${session.sessionToken.substring(0, 20)}... - Expires: ${session.expires}`)
    })
  } else {
    console.log('No sessions found for this user ID')
  }
  
  console.log('\n6️⃣ Checking accounts (OAuth) for this user ID...')
  const accounts = await sql`
    SELECT provider, type
    FROM account 
    WHERE "userId" = ${problematicUserId}
  `
  
  if (accounts.length > 0) {
    console.log(`Found ${accounts.length} OAuth accounts:`)
    accounts.forEach((account, i) => {
      console.log(`${i + 1}. Provider: ${account.provider} - Type: ${account.type}`)
    })
  } else {
    console.log('No OAuth accounts found for this user ID')
  }
  
  const user = userResult.length > 0 ? userResult[0] : null
  
  console.log('\n' + '='.repeat(60))
  console.log('DIAGNOSIS:')
  console.log('='.repeat(60))
  
  if (!user) {
    console.log('❌ PROBLEM: User ID does not exist in the database')
    console.log('\nPossible causes:')
    console.log('1. User signed in with Google but the user record was not created')
    console.log('2. User ID in session token is stale/incorrect')
    console.log('3. Database connection issue during user creation')
    console.log('4. User was deleted but session still exists')
    console.log('\nSOLUTION:')
    console.log('1. User should sign out and sign in again with Google')
    console.log('2. Check NextAuth adapter is properly creating users')
    console.log('3. Clear browser cookies and try again')
  } else {
    console.log('✅ User exists - the error might be intermittent or already resolved')
  }
}

debugUserIdFlow().catch(console.error)
