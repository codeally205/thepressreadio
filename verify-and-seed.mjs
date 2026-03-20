#!/usr/bin/env node

import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const sql = postgres(process.env.DATABASE_URL)

async function verifyAndSeed() {
  console.log('🔍 Verifying database schema and seeding data...\n')
  
  try {
    // 1. Check all tables exist
    console.log('📋 Checking database tables...')
    const tables = await sql`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `
    
    console.log(`Found ${tables.length} tables:`)
    tables.forEach(table => {
      console.log(`  ✅ ${table.table_name}`)
    })
    
    const expectedTables = [
      'account', 'ad_interactions', 'ads', 'article_tags', 'article_views',
      'articles', 'media', 'newsletter_sends', 'newsletters', 'payment_events',
      'session', 'short_video_likes', 'short_video_views', 'short_videos',
      'sidebar_cache', 'subscriptions', 'tags', 'user', 'verificationToken'
    ]
    
    const missingTables = expectedTables.filter(expected => 
      !tables.find(t => t.table_name === expected)
    )
    
    if (missingTables.length > 0) {
      console.log('\n❌ Missing tables:', missingTables.join(', '))
      console.log('Please run: npm run db:push')
      return
    }
    
    console.log('\n✅ All required tables exist!')
    
    // 2. Check current data
    console.log('\n📊 Checking current data...')
    const userCount = await sql`SELECT COUNT(*) as count FROM "user"`
    const articleCount = await sql`SELECT COUNT(*) as count FROM articles`
    const adCount = await sql`SELECT COUNT(*) as count FROM ads`
    
    console.log(`  - Users: ${userCount[0].count}`)
    console.log(`  - Articles: ${articleCount[0].count}`)
    console.log(`  - Ads: ${adCount[0].count}`)
    
    // 3. Create admin user if doesn't exist
    console.log('\n👤 Ensuring admin user exists...')
    const adminUser = await sql`
      INSERT INTO "user" (name, email, role, auth_provider, created_at, updated_at)
      VALUES ('Admin User', 'admin@thepressradio.com', 'admin', 'email', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW()
      RETURNING id, email
    `
    console.log(`✅ Admin user ready: ${adminUser[0].email}`)
    
    // 4. Create sample ads if none exist
    if (parseInt(adCount[0].count) === 0) {
      console.log('\n📢 Creating sample ads...')
      const sampleAds = [
        {
          title: 'Subscribe to Premium',
          description: 'Get unlimited access to all premium content',
          linkUrl: '/subscribe',
          buttonText: 'Subscribe Now',
          position: 'sidebar',
          status: 'active',
          targetAudience: 'unsubscribed'
        },
        {
          title: 'African Business Summit 2024',
          description: 'Join leaders from across Africa',
          linkUrl: 'https://example.com/summit',
          buttonText: 'Register Now',
          position: 'banner',
          status: 'active',
          targetAudience: 'all'
        }
      ]
      
      for (const ad of sampleAds) {
        await sql`
          INSERT INTO ads (
            title, description, link_url, button_text, position, 
            status, target_audience, created_by, created_at, updated_at
          )
          VALUES (
            ${ad.title}, ${ad.description}, ${ad.linkUrl}, ${ad.buttonText},
            ${ad.position}, ${ad.status}, ${ad.targetAudience}, ${adminUser[0].id},
            NOW(), NOW()
          )
        `
      }
      console.log(`✅ Created ${sampleAds.length} sample ads`)
    }
    
    // 5. Create tags if none exist
    console.log('\n🏷️ Ensuring tags exist...')
    const tagCount = await sql`SELECT COUNT(*) as count FROM tags`
    if (parseInt(tagCount[0].count) === 0) {
      const sampleTags = ['technology', 'business', 'politics', 'economy', 'environment', 'health', 'culture']
      for (const tagName of sampleTags) {
        await sql`
          INSERT INTO tags (name, slug)
          VALUES (${tagName}, ${tagName.toLowerCase()})
          ON CONFLICT (slug) DO NOTHING
        `
      }
      console.log(`✅ Created ${sampleTags.length} tags`)
    } else {
      console.log(`✅ Tags already exist: ${tagCount[0].count}`)
    }
    
    // 6. Update articles to have admin as author if needed
    if (parseInt(articleCount[0].count) > 0) {
      console.log('\n📝 Updating articles with admin author...')
      const updated = await sql`
        UPDATE articles 
        SET author_id = ${adminUser[0].id}, updated_at = NOW()
        WHERE author_id IS NULL
        RETURNING id
      `
      console.log(`✅ Updated ${updated.length} articles`)
    }
    
    // 7. Final summary
    console.log('\n📊 Final database summary:')
    const finalCounts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM "user") as users,
        (SELECT COUNT(*) FROM articles) as articles,
        (SELECT COUNT(*) FROM ads) as ads,
        (SELECT COUNT(*) FROM tags) as tags,
        (SELECT COUNT(*) FROM subscriptions) as subscriptions
    `
    
    const summary = finalCounts[0]
    console.log(`  - Users: ${summary.users}`)
    console.log(`  - Articles: ${summary.articles}`)
    console.log(`  - Ads: ${summary.ads}`)
    console.log(`  - Tags: ${summary.tags}`)
    console.log(`  - Subscriptions: ${summary.subscriptions}`)
    
    console.log('\n🎉 Database verification and seeding completed!')
    console.log('\n📝 Admin Login Details:')
    console.log('   Email: admin@thepressradio.com')
    console.log('   Use magic link authentication')
    console.log('\n🚀 Your Neon database is ready to use!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
    console.error(error)
  } finally {
    await sql.end()
  }
}

verifyAndSeed()