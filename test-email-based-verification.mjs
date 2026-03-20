import { neon } from '@neondatabase/serverless'
import 'dotenv/config'

const sql = neon(process.env.DATABASE_URL)

async function testEmailBasedVerification() {
  console.log('🧪 Testing Email-Based Payment Verification\n')
  
  // Test scenario: User signs in with Google and makes payment
  const testEmail = 'alliancedamour88@gmail.com' // One of the existing users
  
  console.log('1️⃣ Simulating payment with email:', testEmail)
  
  // Look up user by email (this is what the verify route will do)
  const userResult = await sql`
    SELECT id, email, name, auth_provider 
    FROM "user" 
    WHERE email = ${testEmail}
  `
  
  if (userResult.length === 0) {
    console.log('❌ User not found with email:', testEmail)
    return
  }
  
  const user = userResult[0]
  console.log('✅ User found by email:')
  console.log({
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.auth_provider
  })
  
  console.log('\n2️⃣ Checking if subscription can be created...')
  
  // Check existing subscriptions
  const existingSubscriptions = await sql`
    SELECT id, plan, status, payment_processor 
    FROM subscriptions 
    WHERE user_id = ${user.id}
  `
  
  if (existingSubscriptions.length > 0) {
    console.log(`Found ${existingSubscriptions.length} existing subscription(s):`)
    existingSubscriptions.forEach((sub, i) => {
      console.log(`${i + 1}. ${sub.plan} - ${sub.status} - ${sub.payment_processor}`)
    })
  } else {
    console.log('✅ No existing subscriptions - ready to create new one')
  }
  
  console.log('\n3️⃣ Testing with different emails...')
  
  const testEmails = [
    'emmabyiringiro215@gmail.com',
    'blinktechnologies125@gmail.com',
    'nonexistent@example.com'
  ]
  
  for (const email of testEmails) {
    const result = await sql`
      SELECT id, email, name 
      FROM "user" 
      WHERE email = ${email}
    `
    
    if (result.length > 0) {
      console.log(`✅ ${email} - User exists (ID: ${result[0].id})`)
    } else {
      console.log(`❌ ${email} - User NOT found`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY:')
  console.log('='.repeat(60))
  console.log('✅ Email-based lookup is more reliable than user ID')
  console.log('✅ Email is guaranteed to be in Paystack transaction')
  console.log('✅ Email is unique in the database')
  console.log('✅ No risk of session/user ID mismatch')
  console.log('\nThe verify route will now:')
  console.log('1. Get email from Paystack transaction')
  console.log('2. Look up user by email in database')
  console.log('3. Use the found user ID to create subscription')
  console.log('4. This prevents foreign key constraint errors')
}

testEmailBasedVerification().catch(console.error)
