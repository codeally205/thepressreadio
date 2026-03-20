import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shortVideos, shortVideoLikes } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videoId = params.id

    // Check if video exists
    const video = await db
      .select({ id: shortVideos.id })
      .from(shortVideos)
      .where(eq(shortVideos.id, videoId))
      .limit(1)

    if (!video.length) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Check if user already liked this video
    const existingLike = await db
      .select({ id: shortVideoLikes.id })
      .from(shortVideoLikes)
      .where(
        and(
          eq(shortVideoLikes.videoId, videoId),
          eq(shortVideoLikes.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingLike.length > 0) {
      return NextResponse.json({ error: 'Already liked' }, { status: 400 })
    }

    // Add like
    await db.insert(shortVideoLikes).values({
      videoId,
      userId: session.user.id,
    })

    // Update like count
    await db
      .update(shortVideos)
      .set({
        likeCount: sql`${shortVideos.likeCount} + 1`,
      })
      .where(eq(shortVideos.id, videoId))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error liking video:', error)
    return NextResponse.json({ 
      error: 'Failed to like video' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const videoId = params.id

    // Check if like exists before removing
    const existingLike = await db
      .select({ id: shortVideoLikes.id })
      .from(shortVideoLikes)
      .where(
        and(
          eq(shortVideoLikes.videoId, videoId),
          eq(shortVideoLikes.userId, session.user.id)
        )
      )
      .limit(1)

    if (existingLike.length === 0) {
      return NextResponse.json({ error: 'Like not found' }, { status: 400 })
    }

    // Remove like
    await db
      .delete(shortVideoLikes)
      .where(
        and(
          eq(shortVideoLikes.videoId, videoId),
          eq(shortVideoLikes.userId, session.user.id)
        )
      )

    // Update like count
    await db
      .update(shortVideos)
      .set({
        likeCount: sql`GREATEST(${shortVideos.likeCount} - 1, 0)`,
      })
      .where(eq(shortVideos.id, videoId))

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('Error unliking video:', error)
    return NextResponse.json({ 
      error: 'Failed to unlike video' 
    }, { status: 500 })
  }
}