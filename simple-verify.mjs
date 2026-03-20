#!/usr/bin/env node

import { neon } from '@neondatabase/serverless'

const connectionString = 'postgresql://neondb_owner:npg_3CupOSDIm2fl@ep-wild-rain-ammryvu8-pooler.c-5.us-east-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

async function verify() {
  console.log('🔍 Verifying migration...\n')
  
  try {
    const sql = neon(connectionString)
    
    // Check user table
    const userCount = await sql`SELECT COUNT(*) as count FROM "user"`
    console.log(`👥 Users: ${userCount[0].count}`)
    
    if (userCount[0].count > 0) {
      const users = await sql`SELECT email, role FROM "user" LIMIT 3`
      users.forEach(user => console.log(`  - ${user.email} (${user.role})`)
      )
    }
    
    // Check articles
    const articleCount = await sql`SELECT COUNT(*) as count FROM articles`
    console.log(`\n📰 Articles: ${articleCount[0].count}`)
    
    if (articleCount[0].count > 0) {
      const articles = await sql`SELECT title, category FROM articles LIMIT 3`
      articles.forEach(article => console.log(`  - ${article.title} (${article.category})`))
    }
    
    // Check ads
    const adCount = await sql`SELECT COUNT(*) as count FROM ads`
    console.log(`\n📢 Ads: ${adCount[0].count}`)
    
    if (adCount[0].count > 0) {
      const ads = await sql`SELECT title, status FROM ads LIMIT 3`
      ads.forEach(ad => console.log(`  - ${ad.title} (${ad.status})`))
    }
    
    // Check subscriptions
    const subCount = await sql`SELECT COUNT(*) as count FROM subscriptions`
    console.log(`\n💳 Subscriptions: ${subCount[0].count}`)
    
    console.log('\n✅ Migration verification completed!')
    console.log('\n🚀 Your Neon database is ready for deployment!')
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

verify()