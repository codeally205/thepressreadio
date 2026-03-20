'use client'

import { useEffect, useRef } from 'react'

interface VideoPreviewProps {
  videoUrl: string
  videoType: string
  title: string
  className?: string
}

export default function VideoPreview({ videoUrl, videoType, title, className = '' }: VideoPreviewProps) {
  const videoRef = useRef<HTMLVideoElement>(null)

  useEffect(() => {
    const video = videoRef.current
    if (video && videoType === 'upload') {
      // Auto play when component mounts
      video.play().catch(() => {
        // Autoplay failed, which is normal in some browsers
        console.log('Autoplay prevented by browser')
      })
    }
  }, [videoType])

  if (videoType === 'youtube') {
    const videoId = videoUrl.includes('v=') 
      ? videoUrl.split('v=')[1]?.split('&')[0]
      : videoUrl.split('/').pop()
    
    return (
      <div className={`relative w-full h-full ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=0&loop=1&playlist=${videoId}`}
          className="w-full h-full object-cover"
          allowFullScreen
          allow="autoplay; encrypted-media"
          title={title}
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white bg-opacity-90 rounded-full p-4">
            <svg className="w-12 h-12 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  if (videoType === 'vimeo') {
    const videoId = videoUrl.split('/').pop()
    
    return (
      <div className={`relative w-full h-full ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&controls=0&loop=1`}
          className="w-full h-full object-cover"
          allowFullScreen
          allow="autoplay; encrypted-media"
          title={title}
        />
        <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white bg-opacity-90 rounded-full p-4">
            <svg className="w-12 h-12 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  if (videoType === 'upload') {
    return (
      <div className={`relative w-full h-full ${className}`}>
        <video
          ref={videoRef}
          src={videoUrl}
          className="w-full h-full object-cover"
          autoPlay
          muted
          loop
          playsInline
          onMouseEnter={(e) => {
            e.currentTarget.play()
          }}
          onMouseLeave={(e) => {
            // Keep playing, don't pause on mouse leave for homepage
          }}
        />
        <div className="absolute inset-0 bg-black bg-opacity-10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <div className="bg-white bg-opacity-90 rounded-full p-4">
            <svg className="w-12 h-12 text-gray-800" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
            </svg>
          </div>
        </div>
      </div>
    )
  }

  return null
}