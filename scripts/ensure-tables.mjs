#!/usr/bin/env node

import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL is not set in .env file')
  process.exit(1)
}

const client = postgres(process.env.DATABASE_URL)
const db = drizzle(client)

async function ensureTables() {
  try {
    console.log('🔍 Checking database tables...')
    
    // Check if subscriptions table exists
    const result = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'subscriptions'
      );
    `
    
    if (!result[0].exists) {
      console.log('⚠️  Subscriptions table does not exist')
      console.log('💡 This is normal for a new setup - subscription queries will be skipped')
    } else {
      console.log('✅ Subscriptions table exists')
    }

    // Check if articles table exists
    const articlesResult = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'articles'
      );
    `
    
    if (!articlesResult[0].exists) {
      console.log('⚠️  Articles table does not exist')
    } else {
      console.log('✅ Articles table exists')
    }

    // Check if user table exists (NextAuth)
    const userResult = await client`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'user'
      );
    `
    
    if (!userResult[0].exists) {
      console.log('⚠️  User table does not exist - NextAuth may not be set up')
    } else {
      console.log('✅ User table exists')
    }

    console.log('🎉 Database check completed!')
    
  } catch (error) {
    console.error('❌ Error checking database:', error.message)
  } finally {
    await client.end()
    process.exit(0)
  }
}

ensureTables()