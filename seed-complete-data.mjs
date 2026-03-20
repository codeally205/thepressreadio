#!/usr/bin/env node

import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const sql = postgres(process.env.DATABASE_URL)

async function seedCompleteData() {
  console.log('🌱 Seeding complete database with sample data...\n')
  
  try {
    // 1. Create admin user
    console.log('👤 Creating admin user...')
    const adminUser = await sql`
      INSERT INTO "user" (name, email, role, auth_provider, created_at, updated_at)
      VALUES ('Admin User', 'admin@thepressradio.com', 'admin', 'email', NOW(), NOW())
      ON CONFLICT (email) DO UPDATE SET 
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        updated_at = NOW()
      RETURNING id, email
    `
    console.log(`✅ Admin user: ${adminUser[0].email}`)
    
    // 2. Create sample regular users
    console.log('\n👥 Creating sample users...')
    const users = await sql`
      INSERT INTO "user" (name, email, role, auth_provider, created_at, updated_at)
      VALUES 
        ('John Doe', 'john@example.com', 'viewer', 'google', NOW(), NOW()),
        ('Jane Smith', 'jane@example.com', 'viewer', 'email', NOW(), NOW()),
        ('Mike Johnson', 'mike@example.com', 'viewer', 'google', NOW(), NOW())
      ON CONFLICT (email) DO NOTHING
      RETURNING id, email
    `
    console.log(`✅ Created ${users.length} sample users`)
    
    // 3. Create sample subscriptions
    console.log('\n💳 Creating sample subscriptions...')
    if (users.length > 0) {
      await sql`
        INSERT INTO subscriptions (
          user_id, plan, status, current_period_start, current_period_end,
          payment_processor, created_at, updated_at
        )
        VALUES 
          (${users[0].id}, 'monthly', 'active', NOW(), NOW() + INTERVAL '1 month', 'paystack', NOW(), NOW()),
          (${users[1]?.id || users[0].id}, 'yearly', 'trialing', NOW(), NOW() + INTERVAL '7 days', 'stripe', NOW(), NOW())
        ON CONFLICT DO NOTHING
      `
      console.log('✅ Created sample subscriptions')
    }
    
    // 4. Create sample ads
    console.log('\n📢 Creating sample ads...')
    const ads = [
      {
        title: 'Subscribe to Premium',
        description: 'Get unlimited access to all premium content and exclusive insights',
        linkUrl: '/subscribe',
        buttonText: 'Subscribe Now',
        position: 'sidebar',
        status: 'active',
        targetAudience: 'unsubscribed'
      },
      {
        title: 'African Business Summit 2024',
        description: 'Join leaders from across Africa for the biggest business event of the year',
        linkUrl: 'https://example.com/summit',
        buttonText: 'Register Now',
        position: 'banner',
        status: 'active',
        targetAudience: 'all'
      },
      {
        title: 'Invest in African Tech',
        description: 'Discover the next generation of African technology companies',
        linkUrl: 'https://example.com/invest',
        buttonText: 'Learn More',
        position: 'inline',
        status: 'active',
        targetAudience: 'subscribers'
      }
    ]
    
    for (const ad of ads) {
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
        ON CONFLICT DO NOTHING
      `
    }
    console.log(`✅ Created ${ads.length} sample ads`)
    
    // 5. Create sample newsletter
    console.log('\n📧 Creating sample newsletter...')
    const newsletter = await sql`
      INSERT INTO newsletters (
        subject, preview_text, content, status, created_by, created_at, updated_at
      )
      VALUES (
        'Weekly African Business Roundup',
        'The latest news and insights from across the continent',
        ${JSON.stringify({
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                { type: 'text', text: 'Welcome to our weekly roundup of African business news!' }
              ]
            }
          ]
        })},
        'draft',
        ${adminUser[0].id},
        NOW(),
        NOW()
      )
      ON CONFLICT DO NOTHING
      RETURNING id
    `
    console.log('✅ Created sample newsletter')
    
    // 6. Create sample tags
    console.log('\n🏷️ Creating sample tags...')
    const tags = ['technology', 'business', 'politics', 'economy', 'environment', 'health', 'culture']
    for (const tagName of tags) {
      await sql`
        INSERT INTO tags (name, slug)
        VALUES (${tagName}, ${tagName.toLowerCase()})
        ON CONFLICT (slug) DO NOTHING
      `
    }
    console.log(`✅ Created ${tags.length} tags`)
    
    // 7. Update articles with author
    console.log('\n📝 Updating articles with admin author...')
    await sql`
      UPDATE articles 
      SET author_id = ${adminUser[0].id}, updated_at = NOW()
      WHERE author_id IS NULL
    `
    console.log('✅ Updated articles with author')
    
    // 8. Create some article views for analytics
    console.log('\n👀 Creating sample article views...')
    const articles = await sql`SELECT id FROM articles LIMIT 10`
    for (const article of articles) {
      // Create some anonymous views
      for (let i = 0; i < Math.floor(Math.random() * 50) + 10; i++) {
        await sql`
          INSERT INTO article_views (article_id, fingerprint, viewed_at)
          VALUES (
            ${article.id}, 
            ${`fp_${Math.random().toString(36).substr(2, 9)}`},
            NOW() - INTERVAL '${Math.floor(Math.random() * 30)} days'
          )
          ON CONFLICT DO NOTHING
        `
      }
    }
    console.log('✅ Created sample article views')
    
    // 9. Check final counts
    console.log('\n📊 Final database summary:')
    const counts = await sql`
      SELECT 
        (SELECT COUNT(*) FROM "user") as users,
        (SELECT COUNT(*) FROM articles) as articles,
        (SELECT COUNT(*) FROM subscriptions) as subscriptions,
        (SELECT COUNT(*) FROM ads) as ads,
        (SELECT COUNT(*) FROM newsletters) as newsletters,
        (SELECT COUNT(*) FROM tags) as tags,
        (SELECT COUNT(*) FROM article_views) as article_views
    `
    
    const summary = counts[0]
    console.log(`  - Users: ${summary.users}`)
    console.log(`  - Articles: ${summary.articles}`)
    console.log(`  - Subscriptions: ${summary.subscriptions}`)
    console.log(`  - Ads: ${summary.ads}`)
    console.log(`  - Newsletters: ${summary.newsletters}`)
    console.log(`  - Tags: ${summary.tags}`)
    console.log(`  - Article Views: ${summary.article_views}`)
    
    console.log('\n🎉 Database seeding completed successfully!')
    console.log('\n📝 Admin Login:')
    console.log('   Email: admin@thepressradio.com')
    console.log('   Use magic link authentication')
    console.log('\n🚀 Your online database is ready!')
    
  } catch (error) {
    console.error('❌ Seeding failed:', error.message)
    console.error(error)
  } finally {
    await sql.end()
  }
}

seedCompleteData()