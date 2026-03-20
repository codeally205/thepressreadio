#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'

const connectionString = 'postgresql://neondb_owner:npg_3CupOSDIm2fl@ep-wild-rain-ammryvu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function checkTables() {
  console.log('🔍 Checking existing tables...\n')
  
  try {
    const sql = neon(connectionString)
    
    // Check existing tables
    const tables = await sql`
      SELECT table_name, table_type 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `
    
    console.log('📊 Existing tables:')
    if (tables.length === 0) {
      console.log('  No tables found')
    } else {
      tables.forEach(table => {
        console.log(`  - ${table.table_name} (${table.table_type})`)
      })
    }
    
    // Check key tables for data
    const keyTables = ['user', 'articles', 'ads', 'subscriptions']
    
    for (const tableName of keyTables) {
      const tableExists = tables.find(t => t.table_name === tableName)
      if (tableExists) {
        try {
          const count = await sql`SELECT COUNT(*) as count FROM ${sql(tableName)}`
          console.log(`\n📊 ${tableName}: ${count[0].count} records`)
          
          if (tableName === 'user' && count[0].count > 0) {
            const users = await sql`SELECT email, role FROM ${sql(tableName)} LIMIT 3`
            users.forEach(user => {
              console.log(`  - ${user.email} (${user.role || 'no role'})`)
            })
          }
          
          if (tableName === 'articles' && count[0].count > 0) {
            const articles = await sql`SELECT title FROM ${sql(tableName)} LIMIT 3`
            articles.forEach(article => {
              console.log(`  - ${article.title}`)
            })
          }
          
        } catch (err) {
          console.log(`❌ Could not read ${tableName}:`, err.message)
        }
      }
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

checkTables()