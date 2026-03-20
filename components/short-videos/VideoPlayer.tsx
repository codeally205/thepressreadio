'use client'

import { useState, useRef, useEffect } from 'react'
import { useSession } from 'next-auth/react'

interface Video {
  id: string
  title: string
  description?: string
  videoUrl: string
  viewCount: number
  likeCount: number
  createdAt: string
  uploadedBy?: {
    id: string
    name?: string
    email?: string
  }
}

interface VideoPlayerProps {
  video: Video
  onLike?: (videoId: string) => void
  onView?: (videoId: string) => void
  isLiked?: boolean
}

export default function VideoPlayer({ video, onLike, onView, isLiked = false }: VideoPlayerProps) {
  const { data: session } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasViewed, setHasViewed] = useState(false)
  const [showControls, setShowControls] = useState(false)

  const handlePlayPause = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
        // Track view on first play
        if (!hasViewed && onView) {
          onView(video.id)
          setHasViewed(true)
        }
      }
      setIsPlaying(!isPlaying)
    }
  }

  const handleLike = () => {
    if (onLike && session?.user) {
      onLike(video.id)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60))
    
    if (diffInHours < 1) return 'Just now'
    if (diffInHours < 24) return `${diffInHours}h ago`
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)}d ago`
    return date.toLocaleDateString()
  }

  const formatCount = (count: number) => {
    if (count < 1000) return count.toString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
    return `${(count / 1000000).toFixed(1)}M`
  }

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    video.addEventListener('play', handlePlay)
    video.addEventListener('pause', handlePause)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('play', handlePlay)
      video.removeEventListener('pause', handlePause)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <div className="bg-white border border-gray-200 overflow-hidden">
      {/* Video Container */}
      <div 
        className="relative aspect-[9/16] bg-black cursor-pointer group"
        onClick={handlePlayPause}
        onMouseEnter={() => setShowControls(true)}
        onMouseLeave={() => setShowControls(false)}
      >
        <video
          ref={videoRef}
          src={video.videoUrl}
          className="w-full h-full object-cover"
          loop
          muted
          playsInline
          preload="metadata"
        />
        
        {/* Play/Pause Overlay */}
        <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0'
        }`}>
          <div className="bg-black bg-opacity-50 rounded-full p-4">
            {isPlaying ? (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </div>
        </div>

        {/* Loading indicator */}
        {!videoRef.current?.readyState && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
          </div>
        )}
      </div>

      {/* Video Info */}
      <div className="p-4">
        <h3 className="font-semibold text-black mb-2 line-clamp-2">
          {video.title}
        </h3>
        
        {video.description && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {video.description}
          </p>
        )}

        {/* Stats and Actions */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-gray-500">
            <span className="flex items-center">
              <svg className="w-4 h-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              {formatCount(video.viewCount)}
            </span>
            <span>{formatDate(video.createdAt)}</span>
          </div>

          {/* Like Button */}
          {session?.user && (
            <button
              onClick={handleLike}
              className={`flex items-center space-x-1 px-3 py-1 text-sm transition-colors ${
                isLiked
                  ? 'text-red-600 hover:text-red-700'
                  : 'text-gray-600 hover:text-red-600'
              }`}
            >
              <svg 
                className="w-4 h-4" 
                fill={isLiked ? 'currentColor' : 'none'} 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{formatCount(video.likeCount)}</span>
            </button>
          )}
        </div>

        {/* Uploader Info */}
        {video.uploadedBy && (
          <div className="mt-3 pt-3 border-t border-gray-200">
            <p className="text-xs text-gray-500">
              Uploaded by {video.uploadedBy.name || video.uploadedBy.email}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}