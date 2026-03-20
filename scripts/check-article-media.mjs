import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { articles } from '../lib/db/schema.js'
import { eq } from 'drizzle-orm'

async function checkArticleMedia() {
  try {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }

    const client = postgres(connectionString)
    const db = drizzle(client)

    console.log('🔍 Checking article media data...\n')
    
    // Get all published articles
    const allArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug,
        coverImageUrl: articles.coverImageUrl,
        videoUrl: articles.videoUrl,
        videoType: articles.videoType,
        status: articles.status
      })
      .from(articles)
      .where(eq(articles.status, 'published'))
      .limit(10)

    console.log(`Found ${allArticles.length} published articles:\n`)
    
    allArticles.forEach((article, index) => {
      console.log(`${index + 1}. "${article.title}"`)
      console.log(`   Slug: ${article.slug}`)
      console.log(`   Cover Image: ${article.coverImageUrl ? '✅ Yes' : '❌ No'}`)
      console.log(`   Video URL: ${article.videoUrl ? '✅ Yes' : '❌ No'}`)
      if (article.videoUrl) {
        console.log(`   Video Type: ${article.videoType || 'Not specified'}`)
      }
      console.log(`   Has Media: ${(article.coverImageUrl || article.videoUrl) ? '✅ Yes' : '❌ No'}`)
      console.log('')
    })

    // Count articles by media type
    const articlesWithVideos = allArticles.filter(a => a.videoUrl)
    const articlesWithImages = allArticles.filter(a => a.coverImageUrl && !a.videoUrl)
    const articlesWithNoMedia = allArticles.filter(a => !a.coverImageUrl && !a.videoUrl)
    
    console.log(`📊 Summary:`)
    console.log(`   Total articles: ${allArticles.length}`)
    console.log(`   Articles with videos: ${articlesWithVideos.length}`)
    console.log(`   Articles with only images: ${articlesWithImages.length}`)
    console.log(`   Articles with no media: ${articlesWithNoMedia.length}`)

    if (articlesWithNoMedia.length > 0) {
      console.log(`\n⚠️  Articles with no media:`)
      articlesWithNoMedia.forEach(article => {
        console.log(`   - "${article.title}" (${article.slug})`)
      })
    }

    await client.end()

  } catch (error) {
    console.error('❌ Error checking articles:', error)
  }
}

checkArticleMedia()