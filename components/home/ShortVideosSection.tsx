'use client'

import Link from 'next/link'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { useToast } from '@/components/ui/Toast'

interface Video {
  id: string
  title: string
  videoUrl: string
  thumbnailUrl?: string
  duration?: number
  viewCount: number
  likeCount: number
  createdAt: string
  uploadedBy?: {
    id: string
    name?: string
  }
}

interface ShortVideosSectionProps {
  videos: Video[]
}

// Simple SVG icons
const ChevronLeftIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
  </svg>
)

const ChevronRightIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
  </svg>
)

const PlayIcon = ({ className }: { className: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M8 5v14l11-7z"/>
  </svg>
)

const VideoCard = ({ 
  video, 
  onLike, 
  onVideoPlay, 
  isLiked, 
  stats,
  isLiking 
}: { 
  video: Video
  onLike: (videoId: string, event: React.MouseEvent) => void
  onVideoPlay: (videoId: string) => void
  isLiked: boolean
  stats: { views: number; likes: number }
  isLiking: boolean
}) => {
  const { data: session } = useSession()
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [hasViewed, setHasViewed] = useState(false)

  const handlePlayPause = (event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause()
      } else {
        videoRef.current.play()
        // Track view on first play
        if (!hasViewed) {
          onVideoPlay(video.id)
          setHasViewed(true)
        }
      }
      setIsPlaying(!isPlaying)
    }
  }

  useEffect(() => {
    const videoElement = videoRef.current
    if (!videoElement) return

    const handlePlay = () => setIsPlaying(true)
    const handlePause = () => setIsPlaying(false)
    const handleEnded = () => setIsPlaying(false)

    videoElement.addEventListener('play', handlePlay)
    videoElement.addEventListener('pause', handlePause)
    videoElement.addEventListener('ended', handleEnded)

    return () => {
      videoElement.removeEventListener('play', handlePlay)
      videoElement.removeEventListener('pause', handlePause)
      videoElement.removeEventListener('ended', handleEnded)
    }
  }, [])

  return (
    <Link href="/short-videos" className="group block">
      <div className="relative">
        {/* Video Container - 50vh height */}
        <div className="h-[50vh] relative overflow-hidden bg-gray-900 rounded-lg">
          <video
            ref={videoRef}
            src={video.videoUrl}
            className="w-full h-full object-cover"
            loop
            muted
            playsInline
            preload="metadata"
          />
          
          {/* Play/Pause Button Overlay */}
          <div 
            className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
            onClick={handlePlayPause}
          >
            <div className="w-12 h-12 bg-white bg-opacity-90 rounded-full flex items-center justify-center">
              {isPlaying ? (
                <svg className="w-6 h-6 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              ) : (
                <PlayIcon className="w-6 h-6 text-gray-900 ml-1" />
              )}
            </div>
          </div>

          {/* Duration Badge */}
          <div className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {video.duration ? `${Math.floor(video.duration / 60)}:${(video.duration % 60).toString().padStart(2, '0')}` : '0:00'}
          </div>

          {/* View Count Badge */}
          <div className="absolute top-2 left-2 bg-black bg-opacity-75 text-white text-xs px-2 py-1 rounded">
            {stats.views} views
          </div>

          {/* Like Button */}
          {session?.user && (
            <button
              onClick={(e) => onLike(video.id, e)}
              disabled={isLiking}
              className={`absolute top-2 right-2 p-2 rounded-full transition-colors disabled:opacity-50 ${
                isLiked
                  ? 'bg-red-600 text-white'
                  : 'bg-black bg-opacity-50 text-white hover:bg-red-600'
              }`}
            >
              {isLiking ? (
                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
              ) : (
                <svg 
                  className="w-4 h-4" 
                  fill={isLiked ? 'currentColor' : 'none'} 
                  viewBox="0 0 24 24" 
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              )}
            </button>
          )}
        </div>

        {/* Video Info */}
        <div className="mt-2">
          <h3 className="font-medium text-sm line-clamp-2 group-hover:text-brand transition leading-tight">
            {video.title}
          </h3>
          
          {/* Stats */}
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-gray-500">
              by {video.uploadedBy?.name || 'Unknown'}
            </p>
            {session?.user && (
              <div className="flex items-center space-x-2 text-xs text-gray-500">
                <span className="flex items-center">
                  <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" clipRule="evenodd" />
                  </svg>
                  {stats.likes}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  )
}

export default function ShortVideosSection({ videos }: ShortVideosSectionProps) {
  const { data: session } = useSession()
  const { success, error } = useToast()
  const [currentIndex, setCurrentIndex] = useState(0)
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set())
  const [videoStats, setVideoStats] = useState<Record<string, { views: number; likes: number }>>({})
  const [likingVideos, setLikingVideos] = useState<Set<string>>(new Set())
  const videosPerView = 5

  const loadUserLikes = useCallback(async () => {
    try {
      const videoIds = videos.map(v => v.id).join(',')
      const response = await fetch(`/api/short-videos/likes?videoIds=${videoIds}`)
      if (response.ok) {
        const data = await response.json()
        setLikedVideos(new Set(data.likedVideoIds))
      }
    } catch (error) {
      console.error('Error loading user likes:', error)
    }
  }, [videos])

  // Initialize video stats and load user likes
  useEffect(() => {
    const initialStats: Record<string, { views: number; likes: number }> = {}
    videos.forEach(video => {
      initialStats[video.id] = {
        views: video.viewCount,
        likes: video.likeCount
      }
    })
    setVideoStats(initialStats)

    // Load user's liked videos if authenticated
    if (session?.user) {
      loadUserLikes()
    }
  }, [videos, session, loadUserLikes])

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '0:00'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const handleLike = async (videoId: string, event: React.MouseEvent) => {
    event.preventDefault()
    event.stopPropagation()
    
    if (!session?.user) {
      error('Please log in to like videos')
      return
    }

    if (likingVideos.has(videoId)) return

    try {
      setLikingVideos(prev => new Set([...prev, videoId]))
      
      const isCurrentlyLiked = likedVideos.has(videoId)
      const newLikedVideos = new Set(likedVideos)
      
      if (isCurrentlyLiked) {
        newLikedVideos.delete(videoId)
      } else {
        newLikedVideos.add(videoId)
      }
      
      setLikedVideos(newLikedVideos)
      
      // Update like count optimistically
      setVideoStats(prev => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          likes: prev[videoId].likes + (isCurrentlyLiked ? -1 : 1)
        }
      }))

      // Make API call
      const response = await fetch(`/api/short-videos/${videoId}/like`, {
        method: isCurrentlyLiked ? 'DELETE' : 'POST'
      })

      if (response.ok) {
        success(isCurrentlyLiked ? 'Video unliked' : 'Video liked!')
      } else {
        // Revert optimistic update on error
        setLikedVideos(likedVideos)
        setVideoStats(prev => ({
          ...prev,
          [videoId]: {
            ...prev[videoId],
            likes: prev[videoId].likes + (isCurrentlyLiked ? 1 : -1)
          }
        }))
        error('Failed to update like')
      }

    } catch (err) {
      console.error('Error toggling like:', err)
      // Revert optimistic update on error
      setLikedVideos(likedVideos)
      error('Failed to update like')
    } finally {
      setLikingVideos(prev => {
        const newSet = new Set(prev)
        newSet.delete(videoId)
        return newSet
      })
    }
  }

  const handleVideoPlay = async (videoId: string) => {
    try {
      // Update view count optimistically
      setVideoStats(prev => ({
        ...prev,
        [videoId]: {
          ...prev[videoId],
          views: prev[videoId].views + 1
        }
      }))

      // Make API call
      await fetch(`/api/short-videos/${videoId}/view`, { method: 'POST' })

    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const formatCount = (count: number) => {
    if (count < 1000) return count.toString()
    if (count < 1000000) return `${(count / 1000).toFixed(1)}K`
    return `${(count / 1000000).toFixed(1)}M`
  }

  const nextSlide = () => {
    setCurrentIndex((prev) => 
      prev + videosPerView >= videos.length ? 0 : prev + videosPerView
    )
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => 
      prev === 0 ? Math.max(0, videos.length - videosPerView) : Math.max(0, prev - videosPerView)
    )
  }

  const visibleVideos = videos.slice(currentIndex, currentIndex + videosPerView)

  if (videos.length === 0) return null

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="font-bold text-2xl uppercase">Short Videos</h2>
        <div className="flex items-center gap-2">
          <button
            onClick={prevSlide}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
            disabled={currentIndex === 0}
          >
            <ChevronLeftIcon className="w-5 h-5 text-gray-600" />
          </button>
          <button
            onClick={nextSlide}
            className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition disabled:opacity-50"
            disabled={currentIndex + videosPerView >= videos.length}
          >
            <ChevronRightIcon className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Videos Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {visibleVideos.map((video) => (
          <VideoCard
            key={video.id}
            video={video}
            onLike={handleLike}
            onVideoPlay={handleVideoPlay}
            isLiked={likedVideos.has(video.id)}
            isLiking={likingVideos.has(video.id)}
            stats={videoStats[video.id] || { views: video.viewCount, likes: video.likeCount }}
          />
        ))}
      </div>
    </div>
  )
}