#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'

const connectionString = 'postgresql://neondb_owner:npg_3CupOSDIm2fl@ep-wild-rain-ammryvu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function verifyData() {
  console.log('🔍 Verifying Neon database data...\n')
  
  try {
    const sql = neon(connectionString)
    
    // Test basic connection
    const version = await sql`SELECT version()`
    console.log('✅ Connected to:', version[0].version.split(' ')[0], version[0].version.split(' ')[1])
    
    // List all tables in public schema
    const tables = await sql`
      SELECT schemaname, tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    
    console.log('\n📊 Tables in public schema:')
    if (tables.length === 0) {
      console.log('  No tables found')
    } else {
      for (const table of tables) {
        console.log(`  - ${table.tablename}`)
        
        // Get row count for each table
        try {
          const count = await sql`SELECT COUNT(*) as count FROM ${sql(table.tablename)}`
          console.log(`    Records: ${count[0].count}`)
        } catch (err) {
          console.log(`    Error counting: ${err.message}`)
        }
      }
    }
    
    // Try to query specific tables
    const testTables = ['user', 'articles', 'ads']
    for (const tableName of testTables) {
      try {
        const result = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`
        console.log(`\n✅ ${tableName} table: ${result[0].count} records`)
        
        if (result[0].count > 0) {
          const sample = await sql`SELECT * FROM ${sql(tableName)} LIMIT 2`
          console.log(`Sample data:`, sample[0])
        }
      } catch (err) {
        console.log(`\n❌ ${tableName} table: ${err.message}`)
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

verifyData()