import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { shortVideos } from '@/lib/db/schema'
import { uploadToCloudinary } from '@/lib/cloudinary'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

const MAX_FILE_SIZE = 100 * 1024 * 1024 // 100MB for Cloudinary
const ALLOWED_TYPES = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('video') as File
    const title = formData.get('title') as string
    const description = formData.get('description') as string

    if (!file) {
      return NextResponse.json({ error: 'No video file provided' }, { status: 400 })
    }

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 })
    }

    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only MP4, WebM, QuickTime, and AVI files are allowed.' 
      }, { status: 400 })
    }

    // Validate file size (100MB for Cloudinary)
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json({ 
        error: 'File too large. Maximum size is 100MB.' 
      }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Generate unique public ID for Cloudinary
    const publicId = `short-video-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    // Upload to Cloudinary
    const cloudinaryResult = await uploadToCloudinary(buffer, {
      folder: 'short-videos',
      resource_type: 'video',
      public_id: publicId,
      transformation: {
        quality: 'auto',
        fetch_format: 'auto'
      }
    }) as any

    // Extract video duration from Cloudinary response (convert to integer seconds)
    const duration = cloudinaryResult.duration ? Math.round(cloudinaryResult.duration) : null

    // Generate thumbnail URL from Cloudinary
    const thumbnailUrl = cloudinaryResult.secure_url.replace('/video/upload/', '/image/upload/c_fill,w_400,h_600,q_auto/')

    // Determine status based on user role
    const status = session.user.role === 'admin' || session.user.role === 'editor' 
      ? 'approved' 
      : 'pending'

    // Save to database
    const [newVideo] = await db.insert(shortVideos).values({
      title,
      description: description || null,
      videoUrl: cloudinaryResult.secure_url,
      thumbnailUrl,
      cloudinaryPublicId: cloudinaryResult.public_id,
      duration,
      mimeType: file.type,
      fileSize: file.size,
      status,
      uploadedBy: session.user.id,
      approvedBy: status === 'approved' ? session.user.id : null,
      approvedAt: status === 'approved' ? new Date() : null,
    }).returning()

    return NextResponse.json({
      success: true,
      video: {
        ...newVideo,
        cloudinaryPublicId: cloudinaryResult.public_id
      },
      message: status === 'approved' 
        ? 'Video uploaded and approved successfully!' 
        : 'Video uploaded successfully! It will be reviewed before being published.'
    })

  } catch (error) {
    console.error('Error uploading short video:', error)
    
    // Handle specific Cloudinary errors
    if (error instanceof Error) {
      if (error.message.includes('Network error') || error.message.includes('ENOTFOUND')) {
        return NextResponse.json({ 
          error: 'Network error: Unable to upload video. Please check your connection and try again.' 
        }, { status: 503 })
      }
      
      if (error.message.includes('timeout') || error.message.includes('Stale request')) {
        return NextResponse.json({ 
          error: 'Upload timeout: The video is too large or your connection is slow. Please try again.' 
        }, { status: 408 })
      }
      
      if (error.message.includes('Cloudinary credentials')) {
        return NextResponse.json({ 
          error: 'Server configuration error. Please contact support.' 
        }, { status: 500 })
      }
    }
    
    return NextResponse.json({ 
      error: 'Failed to upload video. Please try again.' 
    }, { status: 500 })
  }
}