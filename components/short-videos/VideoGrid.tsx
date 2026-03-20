'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import VideoPlayer from './VideoPlayer'

interface Video {
  id: string
  title: string
  description?: string
  videoUrl: string
  viewCount: number
  likeCount: number
  createdAt: string
  status: string
  uploadedBy?: {
    id: string
    name?: string
    email?: string
  }
}

interface VideoGridProps {
  initialVideos?: Video[]
  userId?: string
  showStatus?: boolean
}

export default function VideoGrid({ initialVideos = [], userId, showStatus = false }: VideoGridProps) {
  const { data: session } = useSession()
  const [videos, setVideos] = useState<Video[]>(initialVideos)
  const [loading, setLoading] = useState(!initialVideos.length)
  const [likedVideos, setLikedVideos] = useState<Set<string>>(new Set())

  const loadUserLikes = useCallback(async () => {
    try {
      const videoIds = videos.map(v => v.id).join(',')
      if (videoIds) {
        const response = await fetch(`/api/short-videos/likes?videoIds=${videoIds}`)
        if (response.ok) {
          const data = await response.json()
          setLikedVideos(new Set(data.likedVideoIds))
        }
      }
    } catch (error) {
      console.error('Error loading user likes:', error)
    }
  }, [videos])

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (userId) params.append('userId', userId)
      
      const response = await fetch(`/api/short-videos?${params}`)
      if (response.ok) {
        const data = await response.json()
        setVideos(data.videos)
      }
    } catch (error) {
      console.error('Error fetching videos:', error)
    } finally {
      setLoading(false)
    }
  }, [userId])

  useEffect(() => {
    if (!initialVideos.length) {
      fetchVideos()
    } else if (session?.user) {
      loadUserLikes()
    }
  }, [userId, session, initialVideos.length, fetchVideos, loadUserLikes])

  const handleLike = async (videoId: string) => {
    if (!session?.user) return

    try {
      // Optimistic update
      const isCurrentlyLiked = likedVideos.has(videoId)
      const newLikedVideos = new Set(likedVideos)
      
      if (isCurrentlyLiked) {
        newLikedVideos.delete(videoId)
      } else {
        newLikedVideos.add(videoId)
      }
      
      setLikedVideos(newLikedVideos)
      
      // Update video like count
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { 
              ...video, 
              likeCount: video.likeCount + (isCurrentlyLiked ? -1 : 1)
            }
          : video
      ))

      // Make API call
      const response = await fetch(`/api/short-videos/${videoId}/like`, {
        method: isCurrentlyLiked ? 'DELETE' : 'POST'
      })

      if (!response.ok) {
        // Revert optimistic update on error
        fetchVideos()
      }

    } catch (error) {
      console.error('Error toggling like:', error)
      // Revert optimistic update on error
      fetchVideos()
    }
  }

  const handleView = async (videoId: string) => {
    try {
      // Update view count optimistically
      setVideos(prev => prev.map(video => 
        video.id === videoId 
          ? { ...video, viewCount: video.viewCount + 1 }
          : video
      ))

      // Make API call
      await fetch(`/api/short-videos/${videoId}/view`, { method: 'POST' })

    } catch (error) {
      console.error('Error tracking view:', error)
    }
  }

  const getStatusBadge = (status: string) => {
    const badges = {
      pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
      approved: 'bg-green-100 text-green-800 border-green-200',
      rejected: 'bg-red-100 text-red-800 border-red-200'
    }
    
    return (
      <span className={`inline-flex items-center px-2 py-1 text-xs font-medium border ${badges[status as keyof typeof badges] || badges.pending}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 animate-pulse">
            <div className="aspect-[9/16] bg-gray-200" />
            <div className="p-4">
              <div className="h-4 bg-gray-200 mb-2" />
              <div className="h-3 bg-gray-200 w-2/3 mb-3" />
              <div className="flex justify-between">
                <div className="h-3 bg-gray-200 w-16" />
                <div className="h-3 bg-gray-200 w-12" />
              </div>
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (!videos.length) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 p-8 max-w-md mx-auto">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          <h3 className="text-lg font-medium text-black mb-2">No Videos Yet</h3>
          <p className="text-gray-600">
            {userId 
              ? "You haven't uploaded any videos yet." 
              : "No short videos have been published yet."
            }
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {videos.map((video) => (
        <div key={video.id} className="relative">
          {showStatus && (
            <div className="absolute top-2 left-2 z-10">
              {getStatusBadge(video.status)}
            </div>
          )}
          <VideoPlayer
            video={video}
            onLike={handleLike}
            onView={handleView}
            isLiked={likedVideos.has(video.id)}
          />
        </div>
      ))}
    </div>
  )
}