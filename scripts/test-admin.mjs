#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { users, articles, subscriptions } from '../lib/db/schema.js'
import { eq, count } from 'drizzle-orm'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file')
  process.exit(1)
}

const client = postgres(process.env.DATABASE_URL)
const db = drizzle(client)

async function testAdminSystem() {
  try {
    console.log('🔍 Testing admin system database queries...')
    
    // Test basic counts (used in dashboard)
    const [
      totalUsers,
      totalArticles,
      totalSubscriptions
    ] = await Promise.all([
      db.select({ count: count() }).from(users),
      db.select({ count: count() }).from(articles),
      db.select({ count: count() }).from(subscriptions)
    ])

    console.log('✅ Database queries working:')
    console.log(`   - Users: ${totalUsers[0].count}`)
    console.log(`   - Articles: ${totalArticles[0].count}`)
    console.log(`   - Subscriptions: ${totalSubscriptions[0].count}`)

    // Test admin user exists
    const adminUser = await db
      .select()
      .from(users)
      .where(eq(users.email, 'bienvenuealliance@gmail.com'))
      .limit(1)

    if (adminUser.length > 0) {
      console.log(`✅ Admin user found: ${adminUser[0].email} (role: ${adminUser[0].role})`)
    } else {
      console.log('❌ Admin user not found')
    }

    console.log('🎉 Admin system test completed successfully!')
    
  } catch (error) {
    console.error('❌ Error testing admin system:', error.message)
  } finally {
    await client.end()
    process.exit(0)
  }
}

testAdminSystem()