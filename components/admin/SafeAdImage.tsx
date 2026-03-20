'use client'

import { useState } from 'react'
import Image from 'next/image'

interface SafeAdImageProps {
  src: string
  alt: string
  fill?: boolean
  className?: string
  width?: number
  height?: number
  sizes?: string
}

export default function SafeAdImage({ src, alt, fill, className, width, height, sizes }: SafeAdImageProps) {
  const [hasError, setHasError] = useState(false)

  // Don't render anything if there's an error or invalid URL
  if (hasError || !src || !isValidImageUrl(src)) {
    return null
  }

  const handleError = () => {
    setHasError(true)
  }

  // Default sizes for different use cases
  const defaultSizes = sizes || (
    fill 
      ? "(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
      : undefined
  )

  return (
    <Image
      src={src}
      alt={alt}
      fill={fill}
      width={width}
      height={height}
      className={className}
      sizes={defaultSizes}
      onError={handleError}
    />
  )
}

// Helper function to validate if URL looks like an image
function isValidImageUrl(url: string): boolean {
  try {
    const urlObj = new URL(url)
    
    // Check if it's a known image hosting domain or has image extension
    const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg']
    const allowedHosts = [
      'res.cloudinary.com',
      'images.unsplash.com', 
      'lh3.googleusercontent.com',
      'public.blob.vercel-storage.com'
    ]
    
    const hasImageExtension = imageExtensions.some(ext => 
      urlObj.pathname.toLowerCase().includes(ext)
    )
    
    const isAllowedHost = allowedHosts.some(host => 
      urlObj.hostname.includes(host)
    )
    
    // Reject non-image URLs
    const isFormUrl = urlObj.hostname.includes('docs.google.com')
    const isDocumentUrl = urlObj.pathname.includes('/forms/') || 
                         urlObj.pathname.includes('/document/') ||
                         urlObj.pathname.includes('/spreadsheets/')
    
    return (hasImageExtension || isAllowedHost) && !isFormUrl && !isDocumentUrl
  } catch {
    return false
  }
}