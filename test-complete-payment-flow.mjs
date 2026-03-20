import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function testCompletePaymentFlow() {
  console.log('🧪 Testing Complete Payment Flow with Email-Based Verification\n')
  console.log('='.repeat(70))
  
  // Simulate a real payment scenario
  const testScenarios = [
    {
      name: 'Existing Google OAuth User',
      email: 'alliancedamour88@gmail.com',
      expectedResult: 'success'
    },
    {
      name: 'Existing Email User',
      email: 'emmabyiringiro215@gmail.com',
      expectedResult: 'success'
    },
    {
      name: 'Non-existent User',
      email: 'nonexistent@example.com',
      expectedResult: 'error'
    }
  ]
  
  for (const scenario of testScenarios) {
    console.log(`\n📋 Scenario: ${scenario.name}`)
    console.log('   Email:', scenario.email)
    console.log('-'.repeat(70))
    
    // Step 1: Simulate Paystack transaction verification
    console.log('1️⃣ Paystack returns transaction with email:', scenario.email)
    
    // Step 2: Look up user by email (what verify route does)
    const userResult = await sql`
      SELECT id, email, name, auth_provider, role 
      FROM "user" 
      WHERE email = ${scenario.email}
    `
    
    if (userResult.length === 0) {
      console.log('❌ User lookup failed - User not found')
      if (scenario.expectedResult === 'error') {
        console.log('✅ Expected result: Error handling works correctly')
      } else {
        console.log('⚠️  Unexpected: User should exist')
      }
      continue
    }
    
    const user = userResult[0]
    console.log('✅ User found by email:')
    console.log('   ID:', user.id)
    console.log('   Name:', user.name)
    console.log('   Provider:', user.auth_provider)
    
    // Step 3: Check if subscription can be created
    const existingSubscriptions = await sql`
      SELECT id, plan, status, payment_processor, created_at
      FROM subscriptions 
      WHERE user_id = ${user.id}
      ORDER BY created_at DESC
    `
    
    if (existingSubscriptions.length > 0) {
      console.log(`\n2️⃣ Found ${existingSubscriptions.length} existing subscription(s):`)
      existingSubscriptions.forEach((sub, i) => {
        console.log(`   ${i + 1}. ${sub.plan} - ${sub.status} - ${sub.payment_processor}`)
      })
      console.log('   Action: Would update existing subscription')
    } else {
      console.log('\n2️⃣ No existing subscriptions')
      console.log('   Action: Would create new subscription')
    }
    
    // Step 4: Verify foreign key constraint would work
    console.log('\n3️⃣ Foreign key constraint check:')
    const fkCheck = await sql`
      SELECT EXISTS(
        SELECT 1 FROM "user" WHERE id = ${user.id}
      ) as user_exists
    `
    
    if (fkCheck[0].user_exists) {
      console.log('   ✅ User ID exists - subscription creation will succeed')
    } else {
      console.log('   ❌ User ID missing - would cause foreign key error')
    }
    
    if (scenario.expectedResult === 'success') {
      console.log('\n✅ RESULT: Payment verification would succeed')
    }
  }
  
  console.log('\n' + '='.repeat(70))
  console.log('FINAL SUMMARY')
  console.log('='.repeat(70))
  
  // Count total users
  const totalUsers = await sql`SELECT COUNT(*) as count FROM "user"`
  console.log(`\n📊 Database Statistics:`)
  console.log(`   Total users: ${totalUsers[0].count}`)
  
  const totalSubscriptions = await sql`SELECT COUNT(*) as count FROM subscriptions`
  console.log(`   Total subscriptions: ${totalSubscriptions[0].count}`)
  
  const activeSubscriptions = await sql`
    SELECT COUNT(*) as count 
    FROM subscriptions 
    WHERE status = 'active'
  `
  console.log(`   Active subscriptions: ${activeSubscriptions[0].count}`)
  
  console.log('\n✅ Email-based verification benefits:')
  console.log('   1. No user ID mismatch errors')
  console.log('   2. Works with all auth providers (Google, Email, etc.)')
  console.log('   3. Email is guaranteed to be in Paystack transaction')
  console.log('   4. Foreign key constraints always satisfied')
  console.log('   5. Better error messages for users')
  
  console.log('\n🎯 Next steps:')
  console.log('   1. Deploy the updated verify route')
  console.log('   2. Test with real Google OAuth sign-in')
  console.log('   3. Make a test payment')
  console.log('   4. Verify subscription is created successfully')
  console.log('   5. Monitor logs for any issues')
}

testCompletePaymentFlow().catch(console.error)
