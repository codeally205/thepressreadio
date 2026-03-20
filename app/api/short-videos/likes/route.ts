import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shortVideoLikes } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ likedVideoIds: [] })
    }

    const { searchParams } = new URL(request.url)
    const videoIdsParam = searchParams.get('videoIds')
    
    if (!videoIdsParam) {
      return NextResponse.json({ likedVideoIds: [] })
    }

    const videoIds = videoIdsParam.split(',').filter(id => id.trim())
    
    if (videoIds.length === 0) {
      return NextResponse.json({ likedVideoIds: [] })
    }

    const likedVideos = await db
      .select({ videoId: shortVideoLikes.videoId })
      .from(shortVideoLikes)
      .where(
        eq(shortVideoLikes.userId, session.user.id)
      )

    const likedVideoIds = likedVideos
      .map(like => like.videoId)
      .filter(id => videoIds.includes(id))

    return NextResponse.json({ likedVideoIds })

  } catch (error) {
    console.error('Error fetching user likes:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch likes' 
    }, { status: 500 })
  }
}