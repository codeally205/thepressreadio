#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'

const connectionString = 'postgresql://neondb_owner:npg_3CupOSDIm2fl@ep-wild-rain-ammryvu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function testConnection() {
  console.log('🔍 Testing Neon database connection...\n')
  
  try {
    const sql = neon(connectionString)
    const result = await sql`SELECT version(), current_database(), current_user`
    
    console.log('✅ Connection successful!')
    console.log(`📊 Database: ${result[0].current_database}`)
    console.log(`👤 User: ${result[0].current_user}`)
    console.log(`🐘 PostgreSQL: ${result[0].version.split(' ')[1]}\n`)
    
    // Test table creation permissions
    try {
      await sql`SELECT 1`
      console.log('✅ Basic query permissions OK')
    } catch (err) {
      console.error('❌ Query error:', err.message)
    }
    
  } catch (error) {
    console.error('❌ Connection failed:', error.message)
    console.error('Full error:', error)
    process.exit(1)
  }
}

testConnection()