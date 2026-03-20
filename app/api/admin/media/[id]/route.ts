import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { media } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { deleteFromCloudinary } from '@/lib/cloudinary'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const mediaItem = await db
      .select()
      .from(media)
      .where(eq(media.id, params.id))
      .limit(1)

    if (!mediaItem.length) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    return NextResponse.json(mediaItem[0])
  } catch (error) {
    console.error('Error fetching media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const data = await request.json()

    const updatedMedia = await db
      .update(media)
      .set({
        alt: data.alt,
        caption: data.caption,
        updatedAt: new Date(),
      })
      .where(eq(media.id, params.id))
      .returning()

    if (!updatedMedia.length) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    return NextResponse.json(updatedMedia[0])
  } catch (error) {
    console.error('Error updating media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get media info before deleting
    const mediaItem = await db
      .select()
      .from(media)
      .where(eq(media.id, params.id))
      .limit(1)

    if (!mediaItem.length) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 })
    }

    // Delete from Cloudinary
    try {
      const resourceType = mediaItem[0].mimeType.startsWith('video/') ? 'video' : 'image'
      await deleteFromCloudinary(mediaItem[0].filename, resourceType)
    } catch (cloudinaryError) {
      console.error('Error deleting from Cloudinary:', cloudinaryError)
      // Continue with database deletion even if Cloudinary deletion fails
    }

    // Delete from database
    await db
      .delete(media)
      .where(eq(media.id, params.id))

    return NextResponse.json({ message: 'Media deleted successfully' })
  } catch (error) {
    console.error('Error deleting media:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}