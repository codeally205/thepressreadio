#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_3CupOSDIm2fl@ep-wild-rain-ammryvu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function checkTables() {
  console.log('🔍 Checking existing tables in Neon database...\n')
  
  try {
    const sql = neon(connectionString)
    
    // Get all tables
    const tables = await sql`
      SELECT table_name, table_type
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log(`Found ${tables.length} tables:`)
    if (tables.length === 0) {
      console.log('  (No tables found - database is empty)')
    } else {
      tables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`)
      })
    }
    
    // Check for data in key tables
    if (tables.length > 0) {
      console.log('\n📊 Checking data in key tables:')
      
      const keyTables = ['user', 'users', 'articles', 'subscriptions', 'ads', 'newsletters']
      
      for (const tableName of keyTables) {
        const tableExists = tables.find(t => t.table_name === tableName)
        if (tableExists) {
          try {
            const count = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`
            console.log(`  - ${tableName}: ${count[0].count} records`)
          } catch (err) {
            console.log(`  - ${tableName}: Error counting (${err.message})`)
          }
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error checking tables:', error.message)
    process.exit(1)
  }
}

checkTables()