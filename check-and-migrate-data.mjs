#!/usr/bin/env node

import { config } from 'dotenv'
import { drizzle } from 'drizzle-orm/neon-http'
import { neon } from '@neondatabase/serverless'
import * as schema from './lib/db/schema.js'

// Load environment variables
config({ path: '.env' })

const sql = neon(process.env.DATABASE_URL)
const db = drizzle(sql, { schema })

async function checkAndMigrateData() {
  console.log('🔍 Checking current database state...\n')
  
  try {
    // Check if tables exist and have data
    const tables = [
      { name: 'users', table: schema.users },
      { name: 'articles', table: schema.articles },
      { name: 'subscriptions', table: schema.subscriptions },
      { name: 'newsletters', table: schema.newsletters },
      { name: 'ads', table: schema.ads },
      { name: 'media', table: schema.media },
      { name: 'shortVideos', table: schema.shortVideos },
    ]
    
    console.log('📊 Current data in Neon database:')
    let totalRecords = 0
    
    for (const { name, table } of tables) {
      try {
        const count = await db.select().from(table)
        console.log(`  - ${name}: ${count.length} records`)
        totalRecords += count.length
      } catch (err) {
        console.log(`  - ${name}: Error (${err.message})`)
      }
    }
    
    console.log(`\nTotal records: ${totalRecords}`)
    
    if (totalRecords === 0) {
      console.log('\n🆕 Database is empty. Let\'s seed it with initial data...')
      await seedInitialData()
    } else {
      console.log('\n✅ Database already contains data!')
      console.log('\n💡 If you want to add more data or migrate from local:')
      console.log('   1. Run: npm run db:seed (for sample data)')
      console.log('   2. Or use the migration script if you have local data')
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    process.exit(1)
  }
}

async function seedInitialData() {
  console.log('🌱 Seeding initial data...')
  
  try {
    // Create admin user
    const adminUser = await db.insert(schema.users).values({
      name: 'Admin User',
      email: 'admin@thepressradio.com',
      role: 'admin',
      authProvider: 'email',
    }).returning()
    
    console.log('✅ Created admin user')
    
    // Create sample articles
    const sampleArticles = [
      {
        title: 'Welcome to The Press Radio',
        slug: 'welcome-to-the-press-radio',
        excerpt: 'Your premier source for African news and insights.',
        body: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Welcome to The Press Radio, your premier destination for comprehensive African news coverage.'
                }
              ]
            }
          ]
        }),
        category: 'general',
        authorId: adminUser[0].id,
        accessLevel: 'free',
        status: 'published',
        publishedAt: new Date(),
      },
      {
        title: 'African Economic Outlook 2024',
        slug: 'african-economic-outlook-2024',
        excerpt: 'Analyzing the economic trends shaping Africa in 2024.',
        body: JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: 'Africa\'s economic landscape continues to evolve with promising developments across various sectors.'
                }
              ]
            }
          ]
        }),
        category: 'business',
        authorId: adminUser[0].id,
        accessLevel: 'premium',
        status: 'published',
        publishedAt: new Date(),
      }
    ]
    
    await db.insert(schema.articles).values(sampleArticles)
    console.log('✅ Created sample articles')
    
    // Create sample ads
    const sampleAds = [
      {
        title: 'Subscribe to Premium',
        description: 'Get unlimited access to all our premium content',
        linkUrl: '/subscribe',
        buttonText: 'Subscribe Now',
        position: 'sidebar',
        status: 'active',
        targetAudience: 'unsubscribed',
        createdBy: adminUser[0].id,
      }
    ]
    
    await db.insert(schema.ads).values(sampleAds)
    console.log('✅ Created sample ads')
    
    console.log('\n🎉 Initial data seeded successfully!')
    console.log('\n📝 Admin credentials:')
    console.log('   Email: admin@thepressradio.com')
    console.log('   (Use magic link login)')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
  }
}

checkAndMigrateData()