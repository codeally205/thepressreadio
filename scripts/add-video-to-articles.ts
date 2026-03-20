import { db } from '../lib/db'
import { articles } from '../lib/db/schema'
import { eq } from 'drizzle-orm'

// Sample video URLs for testing
const sampleVideos = [
  {
    videoUrl: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
    videoType: 'youtube',
    title: 'YouTube Video Example'
  },
  {
    videoUrl: 'https://vimeo.com/148751763',
    videoType: 'vimeo',
    title: 'Vimeo Video Example'
  },
  {
    videoUrl: 'https://sample-videos.com/zip/10/mp4/SampleVideo_1280x720_1mb.mp4',
    videoType: 'upload',
    title: 'Direct Video Upload Example'
  }
]

async function addVideoToArticles() {
  try {
    console.log('🎥 Adding video data to some articles...\n')
    
    // Get the first few published articles
    const existingArticles = await db
      .select({
        id: articles.id,
        title: articles.title,
        slug: articles.slug
      })
      .from(articles)
      .where(eq(articles.status, 'published'))
      .limit(3)

    if (existingArticles.length === 0) {
      console.log('❌ No published articles found. Please run the seed script first.')
      return
    }

    console.log(`Found ${existingArticles.length} articles to update:\n`)

    // Update each article with video data
    for (let i = 0; i < existingArticles.length && i < sampleVideos.length; i++) {
      const article = existingArticles[i]
      const video = sampleVideos[i]

      await db
        .update(articles)
        .set({
          videoUrl: video.videoUrl,
          videoType: video.videoType,
          videoDuration: 120 // 2 minutes sample duration
        })
        .where(eq(articles.id, article.id))

      console.log(`✅ Updated "${article.title}"`)
      console.log(`   Added ${video.videoType} video: ${video.videoUrl}`)
      console.log(`   Article URL: /article/${article.slug}\n`)
    }

    console.log('🎉 Successfully added video data to articles!')
    console.log('\n📝 Now you should see:')
    console.log('   - Play buttons on article cards on the home page')
    console.log('   - Videos playing on individual article pages')
    console.log('   - Video previews in featured sections')

  } catch (error) {
    console.error('❌ Error adding video data:', error)
  }
}

addVideoToArticles()