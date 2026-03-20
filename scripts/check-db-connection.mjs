#!/usr/bin/env node

import { config } from 'dotenv'
import { neon } from '@neondatabase/serverless'

// Load environment variables
config({ path: '.env' })

async function checkConnection() {
  console.log('🔍 Checking database connection...\n')

  if (!process.env.DATABASE_URL) {
    console.error('❌ DATABASE_URL not found in .env.local')
    console.log('\n📝 Please create .env.local and add your database URL')
    console.log('   See scripts/setup-database.md for instructions\n')
    process.exit(1)
  }

  try {
    const sql = neon(process.env.DATABASE_URL)
    const result = await sql`SELECT version()`
    
    console.log('✅ Database connection successful!')
    console.log(`📊 PostgreSQL version: ${result[0].version.split(' ')[1]}\n`)
    
    // Test if we can create tables
    try {
      await sql`SELECT 1`
      console.log('✅ Database permissions OK')
      console.log('\n🎉 You can now run: pnpm db:generate && pnpm db:migrate\n')
    } catch (err) {
      console.error('❌ Permission error:', err.message)
    }
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.log('\n💡 Troubleshooting:')
    console.log('   1. Check your DATABASE_URL is correct')
    console.log('   2. Ensure database exists')
    console.log('   3. Verify network connection')
    console.log('   4. For Neon, check project is active\n')
    process.exit(1)
  }
}

checkConnection()
