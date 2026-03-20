import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function checkSubscriptionMismatch() {
  console.log('🔍 Checking Subscription Retrieval Issue\n')
  console.log('='.repeat(70))
  
  // The subscription that was just created
  const subscriptionId = '51c5c993-0368-469e-990e-8db76d7d5417'
  const email = 'emmabyiringiro215@gmail.com'
  
  console.log('\n1️⃣ Finding the created subscription...')
  const subscription = await sql`
    SELECT id, user_id, plan, status, trial_ends_at, created_at
    FROM subscriptions 
    WHERE id = ${subscriptionId}
  `
  
  if (subscription.length === 0) {
    console.log('❌ Subscription not found!')
    return
  }
  
  console.log('✅ Subscription found:')
  console.log('   ID:', subscription[0].id)
  console.log('   User ID:', subscription[0].user_id)
  console.log('   Plan:', subscription[0].plan)
  console.log('   Status:', subscription[0].status)
  console.log('   Trial ends:', subscription[0].trial_ends_at)
  
  const subscriptionUserId = subscription[0].user_id
  
  console.log('\n2️⃣ Finding user by email...')
  const userByEmail = await sql`
    SELECT id, email, name, auth_provider
    FROM "user" 
    WHERE email = ${email}
  `
  
  if (userByEmail.length === 0) {
    console.log('❌ User not found by email!')
    return
  }
  
  console.log('✅ User found by email:')
  console.log('   ID:', userByEmail[0].id)
  console.log('   Email:', userByEmail[0].email)
  console.log('   Name:', userByEmail[0].name)
  console.log('   Provider:', userByEmail[0].auth_provider)
  
  console.log('\n3️⃣ Checking if IDs match...')
  if (subscriptionUserId === userByEmail[0].id) {
    console.log('✅ IDs MATCH - Subscription is correctly linked to user')
  } else {
    console.log('❌ IDs DO NOT MATCH!')
    console.log('   Subscription user_id:', subscriptionUserId)
    console.log('   User ID from email:', userByEmail[0].id)
  }
  
  console.log('\n4️⃣ Checking all subscriptions for this user...')
  const allSubscriptions = await sql`
    SELECT id, plan, status, payment_processor, created_at
    FROM subscriptions 
    WHERE user_id = ${userByEmail[0].id}
    ORDER BY created_at DESC
  `
  
  console.log(`Found ${allSubscriptions.length} subscription(s):`)
  allSubscriptions.forEach((sub, i) => {
    console.log(`   ${i + 1}. ${sub.plan} - ${sub.status} - ${sub.payment_processor} - ${sub.created_at}`)
  })
  
  console.log('\n5️⃣ Checking sessions for this user...')
  const sessions = await sql`
    SELECT "sessionToken", "userId", expires
    FROM session 
    WHERE "userId" = ${userByEmail[0].id}
    ORDER BY expires DESC
    LIMIT 3
  `
  
  if (sessions.length > 0) {
    console.log(`Found ${sessions.length} session(s):`)
    sessions.forEach((session, i) => {
      const isExpired = new Date(session.expires) < new Date()
      console.log(`   ${i + 1}. Token: ${session.sessionToken.substring(0, 20)}... - Expires: ${session.expires} ${isExpired ? '(EXPIRED)' : '(ACTIVE)'}`)
    })
  } else {
    console.log('❌ No sessions found for this user!')
  }
  
  console.log('\n6️⃣ Testing account page query...')
  // This is what the account page does
  const accountPageQuery = await sql`
    SELECT id, plan, status, trial_ends_at, current_period_end
    FROM subscriptions 
    WHERE user_id = ${userByEmail[0].id}
    ORDER BY created_at DESC
    LIMIT 1
  `
  
  if (accountPageQuery.length > 0) {
    console.log('✅ Account page would find subscription:')
    console.log('   Plan:', accountPageQuery[0].plan)
    console.log('   Status:', accountPageQuery[0].status)
    console.log('   Trial ends:', accountPageQuery[0].trial_ends_at)
  } else {
    console.log('❌ Account page would NOT find subscription')
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('DIAGNOSIS:')
  console.log('='.repeat(70))
  
  if (accountPageQuery.length > 0) {
    console.log('✅ Subscription is correctly saved and retrievable')
    console.log('\nIf account page shows "No subscription", possible causes:')
    console.log('1. Session user ID is different from database user ID')
    console.log('2. Browser cache needs to be cleared')
    console.log('3. Need to refresh the page')
    console.log('4. Session needs to be regenerated (sign out and sign in)')
  } else {
    console.log('❌ Subscription retrieval issue detected')
    console.log('\nPossible causes:')
    console.log('1. User ID mismatch between session and database')
    console.log('2. Subscription was created for wrong user ID')
  }
  
  console.log('\n💡 SOLUTION:')
  console.log('The account page should also use email-based lookup!')
  console.log('Instead of: WHERE user_id = session.user.id')
  console.log('Use: WHERE user_id = (SELECT id FROM user WHERE email = session.user.email)')
}

checkSubscriptionMismatch().catch(console.error)
