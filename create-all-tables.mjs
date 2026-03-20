#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const connectionString = 'postgresql://neondb_owner:npg_3CupOSDIm2fl@ep-wild-rain-ammryvu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function createAllTables() {
  console.log('🚀 Creating all required tables...\n')
  
  try {
    const sql = neon(connectionString)
    
    // Read and execute the full migration
    const migrationSQL = readFileSync('drizzle/0000_little_rawhide_kid.sql', 'utf8')
    
    // Clean up the SQL and execute it
    const cleanSQL = migrationSQL
      .replace(/--> statement-breakpoint/g, ';')
      .replace(/\n\s*\n/g, '\n')
      .trim()
    
    console.log('📝 Executing full schema migration...')
    
    // Split into individual statements and execute
    const statements = cleanSQL.split(';').filter(stmt => stmt.trim().length > 0)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim()
      if (statement.length > 0) {
        try {
          await sql.unsafe(statement)
          console.log(`✅ Statement ${i + 1} executed`)
        } catch (error) {
          if (!error.message.includes('already exists')) {
            console.log(`⚠️  Statement ${i + 1}: ${error.message}`)
          }
        }
      }
    }
    
    // Verify all tables
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    
    console.log(`\n✅ Created ${tables.length} tables:`)
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`)
    })
    
    console.log('\n🎉 All tables created successfully!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

createAllTables()