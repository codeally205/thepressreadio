#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from '../lib/db/schema.ts'
import { eq } from 'drizzle-orm'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file')
  process.exit(1)
}

const client = postgres(process.env.DATABASE_URL)
const db = drizzle(client)

const adminEmail = process.argv[2]

if (!adminEmail) {
  console.error('Please provide an email address')
  console.log('Usage: node scripts/create-admin.mjs admin@example.com')
  process.exit(1)
}

try {
  console.log(`🔍 Looking for user with email: ${adminEmail}`)
  
  // First check if user exists
  const existingUser = await db
    .select()
    .from(users)
    .where(eq(users.email, adminEmail))
    .limit(1)

  if (existingUser.length === 0) {
    console.log(`❌ User with email ${adminEmail} not found`)
    console.log('The user must sign in first before being made an admin')
    console.log('Steps:')
    console.log('1. Go to /login')
    console.log('2. Sign in with this email address')
    console.log('3. Run this script again')
  } else {
    // Update user role to admin
    const result = await db
      .update(users)
      .set({ 
        role: 'admin',
        updatedAt: new Date()
      })
      .where(eq(users.email, adminEmail))
      .returning()

    console.log(`✅ Successfully made ${adminEmail} an admin`)
    console.log('They can now access /admin routes')
    console.log(`Current user details:`)
    console.log(`- Name: ${result[0].name || 'Not set'}`)
    console.log(`- Role: ${result[0].role}`)
    console.log(`- Auth Provider: ${result[0].authProvider}`)
  }
} catch (error) {
  console.error('❌ Error creating admin:', error.message)
} finally {
  await client.end()
  process.exit(0)
}