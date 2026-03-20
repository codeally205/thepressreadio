import { db } from '../lib/db'
import { articles } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

async function checkArticlesWithVideos() {
  try {
    console.log('🔍 Checking articles with video data...\n')
    
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
        console.log(`   Video URL: ${article.videoUrl}`)
      }
      console.log('')
    })

    // Count articles with videos
    const articlesWithVideos = allArticles.filter(a => a.videoUrl)
    console.log(`📊 Summary:`)
    console.log(`   Total articles: ${allArticles.length}`)
    console.log(`   Articles with videos: ${articlesWithVideos.length}`)
    console.log(`   Articles with only images: ${allArticles.filter(a => a.coverImageUrl && !a.videoUrl).length}`)
    console.log(`   Articles with no media: ${allArticles.filter(a => !a.coverImageUrl && !a.videoUrl).length}`)

  } catch (error) {
    console.error('❌ Error checking articles:', error)
  }
}

checkArticlesWithVideos()