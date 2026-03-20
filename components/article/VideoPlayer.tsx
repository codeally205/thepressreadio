'use client'

import { useState } from 'react'

interface VideoPlayerProps {
  videoUrl: string
  videoType: string
  title: string
  className?: string
}

export default function VideoPlayer({ videoUrl, videoType, title, className = '' }: VideoPlayerProps) {
  const [showControls, setShowControls] = useState(false)

  if (videoType === 'youtube') {
    const videoId = videoUrl.includes('v=') 
      ? videoUrl.split('v=')[1]?.split('&')[0]
      : videoUrl.split('/').pop()
    
    return (
      <div className={`aspect-video ${className}`}>
        <iframe
          src={`https://www.youtube.com/embed/${videoId}?autoplay=1&mute=1&controls=1`}
          className="w-full h-full rounded-lg"
          allowFullScreen
          allow="autoplay; encrypted-media"
          title={title}
        />
      </div>
    )
  }

  if (videoType === 'vimeo') {
    const videoId = videoUrl.split('/').pop()
    
    return (
      <div className={`aspect-video ${className}`}>
        <iframe
          src={`https://player.vimeo.com/video/${videoId}?autoplay=1&muted=1&controls=1`}
          className="w-full h-full rounded-lg"
          allowFullScreen
          allow="autoplay; encrypted-media"
          title={title}
        />
      </div>
    )
  }

  if (videoType === 'upload') {
    return (
      <div 
        className={`aspect-video group relative ${className}`}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          src={videoUrl}
          autoPlay
          muted
          loop
          controls={showControls}
          className="w-full h-full object-cover rounded-lg transition-all duration-200"
          title={title}
        />
        {!showControls && (
          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-10 transition-all duration-200 rounded-lg flex items-center justify-center">
            <div className="text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200">
              <svg className="w-16 h-16" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}
      </div>
    )
  }

  return null
}