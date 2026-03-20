import { v2 as cloudinary } from 'cloudinary'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export default cloudinary

// Helper function to upload file buffer to Cloudinary
export async function uploadToCloudinary(
  buffer: Buffer,
  options: {
    folder?: string
    resource_type?: 'image' | 'video' | 'raw' | 'auto'
    public_id?: string
    transformation?: any
  } = {}
) {
  return new Promise((resolve, reject) => {
    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      reject(new Error('Cloudinary credentials not configured'))
      return
    }

    const uploadOptions = {
      folder: options.folder || 'cms-uploads',
      resource_type: options.resource_type || 'auto',
      public_id: options.public_id,
      transformation: options.transformation,
      // Add current timestamp to prevent stale request errors
      timestamp: Math.round(Date.now() / 1000),
      // Additional options to handle network issues
      use_filename: false,
      unique_filename: true,
      timeout: 60000, // 60 second timeout
    }

    console.log('Attempting Cloudinary upload with options:', {
      folder: uploadOptions.folder,
      resource_type: uploadOptions.resource_type,
      timestamp: uploadOptions.timestamp
    })

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Cloudinary upload error:', {
            message: error.message,
            http_code: error.http_code,
            name: error.name
          })
          
          // Handle specific error types
          if (error.message?.includes('ENOTFOUND') || error.message?.includes('network')) {
            reject(new Error('Network error: Unable to connect to Cloudinary. Please check your internet connection.'))
          } else if (error.message?.includes('Stale request')) {
            reject(new Error('Upload timeout: Please try again.'))
          } else {
            reject(error)
          }
        } else {
          console.log('Cloudinary upload successful:', {
            public_id: result?.public_id,
            secure_url: result?.secure_url,
            resource_type: result?.resource_type
          })
          resolve(result)
        }
      }
    )

    uploadStream.end(buffer)
  })
}

// Helper function to delete file from Cloudinary
export async function deleteFromCloudinary(publicId: string, resourceType: 'image' | 'video' | 'raw' = 'image') {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resourceType
    })
    return result
  } catch (error) {
    console.error('Error deleting from Cloudinary:', error)
    throw error
  }
}

// Helper function to generate optimized image URLs
export function getOptimizedImageUrl(publicId: string, options: {
  width?: number
  height?: number
  quality?: string | number
  format?: string
  crop?: string
} = {}) {
  return cloudinary.url(publicId, {
    width: options.width,
    height: options.height,
    quality: options.quality || 'auto',
    format: options.format || 'auto',
    crop: options.crop || 'fill',
  })
}