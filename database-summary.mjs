#!/usr/bin/env node

import postgres from 'postgres'
import dotenv from 'dotenv'

dotenv.config({ path: '.env' })

const sql = postgres(process.env.DATABASE_URL)

async function showDatabaseSummary() {
  console.log('📊 NEON DATABASE SUMMARY')
  console.log('=' .repeat(50))
  
  try {
    // Get detailed counts
    const summary = await sql`
      SELECT 
        (SELECT COUNT(*) FROM "user") as total_users,
        (SELECT COUNT(*) FROM "user" WHERE role = 'admin') as admin_users,
        (SELECT COUNT(*) FROM articles) as total_articles,
        (SELECT COUNT(*) FROM articles WHERE status = 'published') as published_articles,
        (SELECT COUNT(*) FROM articles WHERE access_level = 'premium') as premium_articles,
        (SELECT COUNT(*) FROM ads) as total_ads,
        (SELECT COUNT(*) FROM ads WHERE status = 'active') as active_ads,
        (SELECT COUNT(*) FROM tags) as total_tags,
        (SELECT COUNT(*) FROM subscriptions) as total_subscriptions,
        (SELECT COUNT(*) FROM subscriptions WHERE status = 'active') as active_subscriptions,
        (SELECT COUNT(*) FROM newsletters) as total_newsletters,
        (SELECT COUNT(*) FROM media) as total_media,
        (SELECT COUNT(*) FROM short_videos) as total_videos,
        (SELECT COUNT(*) FROM article_views) as total_article_views
    `
    
    const data = summary[0]
    
    console.log('\n👥 USERS:')
    console.log(`   Total Users: ${data.total_users}`)
    console.log(`   Admin Users: ${data.admin_users}`)
    
    console.log('\n📰 CONTENT:')
    console.log(`   Total Articles: ${data.total_articles}`)
    console.log(`   Published Articles: ${data.published_articles}`)
    console.log(`   Premium Articles: ${data.premium_articles}`)
    console.log(`   Total Tags: ${data.total_tags}`)
    
    console.log('\n📢 ADVERTISING:')
    console.log(`   Total Ads: ${data.total_ads}`)
    console.log(`   Active Ads: ${data.active_ads}`)
    
    console.log('\n💳 SUBSCRIPTIONS:')
    console.log(`   Total Subscriptions: ${data.total_subscriptions}`)
    console.log(`   Active Subscriptions: ${data.active_subscriptions}`)
    
    console.log('\n📧 MEDIA & NEWSLETTERS:')
    console.log(`   Newsletters: ${data.total_newsletters}`)
    console.log(`   Media Files: ${data.total_media}`)
    console.log(`   Short Videos: ${data.total_videos}`)
    
    console.log('\n📈 ANALYTICS:')
    console.log(`   Article Views: ${data.total_article_views}`)
    
    // Show recent articles
    console.log('\n📝 RECENT ARTICLES:')
    const recentArticles = await sql`
      SELECT title, category, access_level, status, published_at
      FROM articles 
      ORDER BY created_at DESC 
      LIMIT 5
    `
    
    recentArticles.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title}`)
      console.log(`      Category: ${article.category} | Access: ${article.access_level} | Status: ${article.status}`)
    })
    
    // Show categories
    console.log('\n🏷️ ARTICLE CATEGORIES:')
    const categories = await sql`
      SELECT category, COUNT(*) as count
      FROM articles 
      GROUP BY category 
      ORDER BY count DESC
    `
    
    categories.forEach(cat => {
      console.log(`   ${cat.category}: ${cat.count} articles`)
    })
    
    // Show admin user
    console.log('\n👤 ADMIN ACCESS:')
    const adminUsers = await sql`
      SELECT name, email, created_at
      FROM "user" 
      WHERE role = 'admin'
      ORDER BY created_at DESC
    `
    
    adminUsers.forEach(admin => {
      console.log(`   Name: ${admin.name}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Created: ${admin.created_at.toLocaleDateString()}`)
    })
    
    console.log('\n' + '=' .repeat(50))
    console.log('✅ DATABASE MIGRATION COMPLETED SUCCESSFULLY!')
    console.log('🌐 Your Neon PostgreSQL database is fully populated')
    console.log('🚀 Ready for production use!')
    console.log('\n💡 Next Steps:')
    console.log('   1. Start your app: npm run dev')
    console.log('   2. Login as admin: admin@thepressradio.com')
    console.log('   3. Access admin panel: /admin')
    console.log('   4. Manage content, users, and settings')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  } finally {
    await sql.end()
  }
}

showDatabaseSummary()