// Check if there are any short videos in the database
import { drizzle } from 'drizzle-orm/postgres-js'
import postgres from 'postgres'
import { shortVideos } from '../lib/db/schema.js'

async function checkShortVideos() {
  try {
    const connectionString = process.env.DATABASE_URL
    if (!connectionString) {
      throw new Error('DATABASE_URL is not set')
    }

    const client = postgres(connectionString)
    const db = drizzle(client)

    console.log('🎬 Checking short videos in database...\n')
    
    const videos = await db
      .select({
        id: shortVideos.id,
        title: shortVideos.title,
        status: shortVideos.status,
        viewCount: shortVideos.viewCount,
        likeCount: shortVideos.likeCount,
        createdAt: shortVideos.createdAt
      })
      .from(shortVideos)

    console.log(`Found ${videos.length} short videos total:`)
    
    if (videos.length === 0) {
      console.log('❌ No short videos found in database')
      console.log('\n📝 To test the short videos feature:')
      console.log('   1. Go to /short-videos/upload (requires login)')
      console.log('   2. Upload a video through the admin panel')
      console.log('   3. Approve the video if you have admin access')
    } else {
      const approved = videos.filter(v => v.status === 'approved')
      const pending = videos.filter(v => v.status === 'pending')
      const rejected = videos.filter(v => v.status === 'rejected')
      
      console.log(`   - ${approved.length} approved`)
      console.log(`   - ${pending.length} pending`)
      console.log(`   - ${rejected.length} rejected`)
      
      console.log('\n📋 Video details:')
      videos.forEach((video, index) => {
        console.log(`   ${index + 1}. "${video.title}" (${video.status})`)
        console.log(`      Views: ${video.viewCount}, Likes: ${video.likeCount}`)
        console.log(`      Created: ${video.createdAt}`)
      })
      
      if (approved.length > 0) {
        console.log('\n✅ Approved videos will show on home page and /short-videos')
      } else {
        console.log('\n⚠️  No approved videos - nothing will show on home page')
      }
    }

    await client.end()

  } catch (error) {
    console.error('❌ Error checking short videos:', error)
  }
}

checkShortVideos()