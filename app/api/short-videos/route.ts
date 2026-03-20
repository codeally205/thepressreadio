import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shortVideos, users } from '@/lib/db/schema'
import { eq, desc, and, or } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    const { searchParams } = new URL(request.url)
    
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '20')
    const offset = parseInt(searchParams.get('offset') || '0')
    const userId = searchParams.get('userId')

    let whereConditions = []

    // If user is not admin/editor, only show approved videos (unless viewing own videos)
    if (!session?.user || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      if (userId && session?.user?.id === userId) {
        // User viewing their own videos - show all their videos
        whereConditions.push(eq(shortVideos.uploadedBy, userId))
      } else {
        // Public view - only approved videos
        whereConditions.push(eq(shortVideos.status, 'approved'))
      }
    } else {
      // Admin/editor view - can filter by status
      if (status) {
        whereConditions.push(eq(shortVideos.status, status))
      }
      if (userId) {
        whereConditions.push(eq(shortVideos.uploadedBy, userId))
      }
    }

    const videos = await db
      .select({
        id: shortVideos.id,
        title: shortVideos.title,
        description: shortVideos.description,
        videoUrl: shortVideos.videoUrl,
        thumbnailUrl: shortVideos.thumbnailUrl,
        duration: shortVideos.duration,
        status: shortVideos.status,
        viewCount: shortVideos.viewCount,
        likeCount: shortVideos.likeCount,
        createdAt: shortVideos.createdAt,
        uploadedBy: {
          id: users.id,
          name: users.name,
          email: users.email,
        },
      })
      .from(shortVideos)
      .leftJoin(users, eq(shortVideos.uploadedBy, users.id))
      .where(whereConditions.length > 0 ? and(...whereConditions) : undefined)
      .orderBy(desc(shortVideos.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({ videos })

  } catch (error) {
    console.error('Error fetching short videos:', error)
    return NextResponse.json({ 
      error: 'Failed to fetch videos' 
    }, { status: 500 })
  }
}