#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users } from '../lib/db/schema.js'
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

async function checkUserSessions() {
  try {
    console.log('🔍 Checking user sessions and database consistency...')
    
    // Check if the admin user exists
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'bienvenuealliance@gmail.com'))
      .limit(1)

    if (adminUser.length > 0) {
      console.log(`✅ Admin user found:`)
      console.log(`   - ID: ${adminUser[0].id}`)
      console.log(`   - Email: ${adminUser[0].email}`)
      console.log(`   - Name: ${adminUser[0].name}`)
      console.log(`   - Role: ${adminUser[0].role}`)
      console.log(`   - Auth Provider: ${adminUser[0].authProvider}`)
    } else {
      console.log('❌ Admin user not found in database')
      console.log('💡 You may need to sign in again to recreate the user record')
    }

    // Count total users
    const allUsers = await db.select().from(users)
    console.log(`📊 Total users in database: ${allUsers.length}`)

    if (allUsers.length > 0) {
      console.log('👥 All users:')
      allUsers.forEach((user, index) => {
        console.log(`   ${index + 1}. ${user.email} (${user.name || 'No name'}) - Role: ${user.role}`)
      })
    }

    console.log('🎉 User session check completed!')
    
  } catch (error) {
    console.error('❌ Error checking user sessions:', error.message)
  } finally {
    await client.end()
    process.exit(0)
  }
}

checkUserSessions()