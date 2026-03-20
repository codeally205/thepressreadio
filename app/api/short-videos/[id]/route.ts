import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shortVideos } from '@/lib/db/schema'
import { deleteFromCloudinary } from '@/lib/cloudinary'
import { eq, and } from 'drizzle-orm'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const { status, title, description } = body

    // Check if user can modify this video
    const video = await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.id, id))
      .limit(1)

    if (!video[0]) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Only admin/editor can approve/reject, or user can edit their own video
    const canModify = 
      session.user.role === 'admin' || 
      session.user.role === 'editor' || 
      video[0].uploadedBy === session.user.id

    if (!canModify) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const updateData: any = {}

    // Only admin/editor can change status
    if (status && (session.user.role === 'admin' || session.user.role === 'editor')) {
      updateData.status = status
      if (status === 'approved') {
        updateData.approvedBy = session.user.id
        updateData.approvedAt = new Date()
      }
    }

    // User can update title and description of their own videos
    if (video[0].uploadedBy === session.user.id) {
      if (title !== undefined) updateData.title = title
      if (description !== undefined) updateData.description = description
    }

    if (Object.keys(updateData).length === 0) {
      return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
    }

    updateData.updatedAt = new Date()

    const [updatedVideo] = await db
      .update(shortVideos)
      .set(updateData)
      .where(eq(shortVideos.id, id))
      .returning()

    return NextResponse.json({ 
      success: true, 
      video: updatedVideo,
      message: 'Video updated successfully'
    })

  } catch (error) {
    console.error('Error updating short video:', error)
    return NextResponse.json({ 
      error: 'Failed to update video' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = params

    // Check if user can delete this video
    const video = await db
      .select()
      .from(shortVideos)
      .where(eq(shortVideos.id, id))
      .limit(1)

    if (!video[0]) {
      return NextResponse.json({ error: 'Video not found' }, { status: 404 })
    }

    // Only admin/editor or video owner can delete
    const canDelete = 
      session.user.role === 'admin' || 
      session.user.role === 'editor' || 
      video[0].uploadedBy === session.user.id

    if (!canDelete) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    // Delete from database first
    await db.delete(shortVideos).where(eq(shortVideos.id, id))

    // Delete from Cloudinary if we have the public ID
    if (video[0].cloudinaryPublicId) {
      try {
        await deleteFromCloudinary(video[0].cloudinaryPublicId, 'video')
      } catch (cloudinaryError) {
        console.error('Error deleting from Cloudinary:', cloudinaryError)
        // Don't fail the entire operation if Cloudinary deletion fails
        // The video is already deleted from the database
      }
    }

    return NextResponse.json({ 
      success: true,
      message: 'Video deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting short video:', error)
    return NextResponse.json({ 
      error: 'Failed to delete video' 
    }, { status: 500 })
  }
}