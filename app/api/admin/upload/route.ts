import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'
import { media } from '@/lib/db/schema'
import { uploadToCloudinary } from '@/lib/cloudinary'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session || (session.user.role !== 'admin' && session.user.role !== 'editor')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml',
      'video/mp4', 'video/webm', 'video/avi', 'video/mov', 'video/quicktime'
    ]
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 })
    }

    // Validate file size (max 4MB for Vercel serverless functions)
    const maxSize = 4 * 1024 * 1024 // 4MB to stay within Vercel limits
    if (file.size > maxSize) {
      return NextResponse.json({ error: 'File too large. Maximum size is 4MB for serverless deployment.' }, { status: 400 })
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)

    // Determine resource type for Cloudinary
    let resourceType: 'image' | 'video' | 'raw' = 'auto' as any
    if (file.type.startsWith('image/')) {
      resourceType = 'image'
    } else if (file.type.startsWith('video/')) {
      resourceType = 'video'
    } else {
      resourceType = 'raw'
    }

    // Upload to Cloudinary
    console.log('Uploading to Cloudinary with resource type:', resourceType)
    
    try {
      const cloudinaryResult = await uploadToCloudinary(buffer, {
        folder: 'cms-uploads',
        resource_type: resourceType,
      }) as any

      console.log('Cloudinary upload successful:', {
        public_id: cloudinaryResult.public_id,
        secure_url: cloudinaryResult.secure_url,
        resource_type: cloudinaryResult.resource_type
      })

      // Save to database
      const mediaRecord = await db
        .insert(media)
        .values({
          filename: cloudinaryResult.public_id,
          originalName: file.name,
          mimeType: file.type,
          size: file.size,
          url: cloudinaryResult.secure_url,
          uploadedBy: session.user.id,
        })
        .returning()

      return NextResponse.json({
        id: mediaRecord[0].id,
        url: cloudinaryResult.secure_url,
        publicId: cloudinaryResult.public_id,
        filename: cloudinaryResult.public_id,
        originalName: file.name,
        size: file.size,
        type: file.type,
        resourceType,
        // Additional Cloudinary info
        width: cloudinaryResult.width,
        height: cloudinaryResult.height,
        format: cloudinaryResult.format,
        duration: cloudinaryResult.duration, // Video duration in seconds
      })
    } catch (cloudinaryError) {
      console.error('Cloudinary upload failed:', cloudinaryError)
      
      // Return specific error message based on the error type
      let errorMessage = 'Failed to upload to cloud storage'
      if (cloudinaryError instanceof Error) {
        if (cloudinaryError.message.includes('Network error')) {
          errorMessage = 'Network error: Unable to connect to cloud storage. Please check your internet connection and try again.'
        } else if (cloudinaryError.message.includes('Upload timeout')) {
          errorMessage = 'Upload timeout: The file upload took too long. Please try with a smaller file or check your connection.'
        } else if (cloudinaryError.message.includes('credentials not configured')) {
          errorMessage = 'Cloud storage not configured properly. Please contact administrator.'
        } else {
          errorMessage = `Upload failed: ${cloudinaryError.message}`
        }
      }
      
      return NextResponse.json({ 
        error: errorMessage,
        details: cloudinaryError instanceof Error ? cloudinaryError.message : 'Unknown error'
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error uploading file:', error)
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}