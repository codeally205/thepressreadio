#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'
import { readFileSync } from 'fs'

const connectionString = 'postgresql://neondb_owner:npg_3CupOSDIm2fl@ep-wild-rain-ammryvu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function setupDatabase() {
  console.log('🚀 Setting up Neon database...\n')
  
  try {
    const sql = neon(connectionString)
    
    // Read the migration file
    const migrationSQL = readFileSync('drizzle/0000_little_rawhide_kid.sql', 'utf8')
    
    // Split by statement breakpoint and execute each statement
    const statements = migrationSQL
      .split('--> statement-breakpoint')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0)
    
    console.log(`📝 Executing ${statements.length} SQL statements...`)
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i]
      if (statement.length > 0) {
        try {
          console.log(`  ${i + 1}. Executing statement...`)
          await sql.unsafe(statement)
          console.log(`  ✅ Statement ${i + 1} executed successfully`)
        } catch (error) {
          console.error(`  ❌ Error in statement ${i + 1}:`, error.message)
          // Continue with other statements
        }
      }
    }
    
    // Verify tables were created
    console.log('\n🔍 Verifying tables...')
    const tables = await sql`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public'
      ORDER BY tablename
    `
    
    console.log(`✅ Created ${tables.length} tables:`)
    tables.forEach(table => {
      console.log(`  - ${table.tablename}`)
    })
    
    console.log('\n🎉 Database setup completed!')
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message)
    process.exit(1)
  }
}

setupDatabase()