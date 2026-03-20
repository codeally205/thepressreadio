import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shortVideos, shortVideoViews } from '@/lib/db/schema'
import { eq, and, sql } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
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

    // Get user fingerprint from request headers or generate one
    const userAgent = request.headers.get('user-agent') || ''
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown'
    const fingerprint = `${ip}-${userAgent}`.slice(0, 255) // Limit length

    let shouldTrackView = true

    if (session?.user?.id) {
      // For authenticated users, check if they already viewed this video
      const existingView = await db
        .select({ id: shortVideoViews.id })
        .from(shortVideoViews)
        .where(
          and(
            eq(shortVideoViews.videoId, videoId),
            eq(shortVideoViews.userId, session.user.id)
          )
        )
        .limit(1)

      shouldTrackView = existingView.length === 0
    } else {
      // For anonymous users, use fingerprint (allow multiple views per session)
      // You might want to implement more sophisticated tracking here
    }

    if (shouldTrackView) {
      // Add view record
      await db.insert(shortVideoViews).values({
        videoId,
        userId: session?.user?.id || null,
        fingerprint: session?.user?.id ? null : fingerprint,
      })

      // Update view count
      await db
        .update(shortVideos)
        .set({
          viewCount: sql`${shortVideos.viewCount} + 1`,
        })
        .where(eq(shortVideos.id, videoId))
    }

    return NextResponse.json({ success: true, tracked: shouldTrackView })

  } catch (error) {
    console.error('Error tracking video view:', error)
    return NextResponse.json({ 
      error: 'Failed to track view' 
    }, { status: 500 })
  }
}