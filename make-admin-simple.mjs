#!/usr/bin/env node

import postgres from 'postgres'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file')
  process.exit(1)
}

const email = process.argv[2] || 'filalliance769@gmail.com'

const sql = postgres(process.env.DATABASE_URL)

try {
  console.log(`🔍 Looking for user: ${email}`)
  
  // Check if user exists
  const users = await sql`
    SELECT id, email, name, role, auth_provider 
    FROM "user" 
    WHERE email = ${email}
  `

  if (users.length === 0) {
    console.log(`❌ User with email ${email} not found`)
    console.log('The user must sign in first before being made an admin')
    process.exit(1)
  }

  const user = users[0]
  console.log('✅ User found:', {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    provider: user.auth_provider
  })

  if (user.role === 'admin') {
    console.log('ℹ️  User is already an admin')
    process.exit(0)
  }

  console.log('📝 Updating user to admin...')

  // Update user role to admin
  await sql`
    UPDATE "user" 
    SET role = 'admin', updated_at = NOW() 
    WHERE email = ${email}
  `

  console.log('✅ User is now an admin!')

  // Verify the update
  const updatedUsers = await sql`
    SELECT id, email, name, role 
    FROM "user" 
    WHERE email = ${email}
  `

  console.log('✅ Verified:', {
    email: updatedUsers[0].email,
    role: updatedUsers[0].role
  })

  console.log('\n🎉 Done! User can now access /admin routes')

} catch (error) {
  console.error('❌ Error:', error.message)
  process.exit(1)
} finally {
  await sql.end()
}
