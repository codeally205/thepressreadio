#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'
import postgres from 'postgres'

// Local database connection
const localDb = postgres('postgresql://postgres:bad00man@localhost:5432/african_news?sslmode=disable')

// Neon database connection
const neonConnectionString = 'postgresql://neondb_owner:npg_3CupOSDIm2fl@ep-wild-rain-ammryvu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'
const neonDb = neon(neonConnectionString)

async function migrateData() {
  console.log('🚀 Starting data migration from local to Neon...\n')
  
  try {
    // First, check what tables exist in local database
    console.log('📊 Checking local database tables...')
    const localTables = await localDb`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `
    
    console.log('Local tables found:')
    localTables.forEach(table => {
      console.log(`  - ${table.table_name}`)
    })
    
    if (localTables.length === 0) {
      console.log('❌ No tables found in local database')
      return
    }
    
    // Create tables in Neon first (push schema)
    console.log('\n🔧 Creating tables in Neon database...')
    
    // Tables to migrate in order (respecting foreign key dependencies)
    const tablesToMigrate = [
      'user', 'users', // User tables first
      'account', 'accounts', // Auth tables
      'session', 'sessions',
      'verificationToken', 'verificationTokens',
      'categories',
      'tags',
      'articles',
      'article_views',
      'media',
      'newsletters',
      'newsletter_subscribers',
      'subscriptions',
      'ads',
      'ad_clicks',
      'ad_impressions',
      'short_videos',
      'video_likes',
      'video_views'
    ]
    
    // Migrate each table
    for (const tableName of tablesToMigrate) {
      const tableExists = localTables.find(t => t.table_name === tableName)
      if (!tableExists) {
        console.log(`⏭️  Skipping ${tableName} (not found in local)`)
        continue
      }
      
      console.log(`\n📦 Migrating ${tableName}...`)
      
      try {
        // Get data from local database
        const data = await localDb`SELECT * FROM ${localDb(tableName)}`
        console.log(`  Found ${data.length} records`)
        
        if (data.length === 0) {
          console.log(`  ✅ ${tableName} - no data to migrate`)
          continue
        }
        
        // Clear existing data in Neon (if any)
        try {
          await neonDb`DELETE FROM ${neonDb(tableName)}`
          console.log(`  🧹 Cleared existing data in ${tableName}`)
        } catch (err) {
          console.log(`  ⚠️  Could not clear ${tableName}: ${err.message}`)
        }
        
        // Insert data into Neon
        if (data.length > 0) {
          // Get column names from first record
          const columns = Object.keys(data[0])
          
          // Prepare values for bulk insert
          const values = data.map(row => columns.map(col => row[col]))
          
          // Build insert query
          const columnList = columns.join(', ')
          const placeholders = data.map((_, i) => 
            `(${columns.map((_, j) => `$${i * columns.length + j + 1}`).join(', ')})`
          ).join(', ')
          
          const insertQuery = `INSERT INTO ${tableName} (${columnList}) VALUES ${placeholders}`
          const flatValues = values.flat()
          
          await neonDb.unsafe(insertQuery, flatValues)
          console.log(`  ✅ Migrated ${data.length} records to ${tableName}`)
        }
        
      } catch (error) {
        console.error(`  ❌ Error migrating ${tableName}:`, error.message)
      }
    }
    
    console.log('\n🎉 Migration completed!')
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    console.error(error)
  } finally {
    await localDb.end()
  }
}

migrateData()