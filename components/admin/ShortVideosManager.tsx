'use client'

import { useState, useEffect, useCallback } from 'react'
import { useToast } from '@/components/ui/Toast'
import LoadingButton from '@/components/ui/LoadingButton'
import { useSession } from 'next-auth/react'

interface Video {
  id: string
  title: string
  description?: string
  videoUrl: string
  thumbnailUrl?: string
  status: string
  viewCount: number
  likeCount: number
  duration?: number
  fileSize?: number
  createdAt: string
  uploadedBy?: {
    id: string
    name?: string
    email?: string
  }
}

interface VideoFormData {
  title: string
  description: string
  status: 'pending' | 'approved' | 'rejected'
}

export default function ShortVideosManager() {
  const { data: session } = useSession()
  const { success, error } = useToast()
  const [videos, setVideos] = useState<Video[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all')
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null)
  const [isUpdating, setIsUpdating] = useState(false)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState<VideoFormData>({
    title: '',
    description: '',
    status: 'pending'
  })

  const fetchVideos = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') params.append('status', filter)
      
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
  }, [filter])

  useEffect(() => {
    fetchVideos()
  }, [fetchVideos])

  const handleUploadSuccess = () => {
    setShowUploadModal(false)
    fetchVideos() // Refresh the list
  }

  const openEditModal = (video: Video) => {
    setSelectedVideo(video)
    setEditFormData({
      title: video.title,
      description: video.description || '',
      status: video.status as 'pending' | 'approved' | 'rejected'
    })
    setShowEditModal(true)
  }

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedVideo) return

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/short-videos/${selectedVideo.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editFormData),
      })

      if (response.ok) {
        const updatedVideo = await response.json()
        setVideos(prev => prev.map(video => 
          video.id === selectedVideo.id 
            ? { ...video, ...editFormData }
            : video
        ))
        setShowEditModal(false)
        setSelectedVideo(null)
      } else {
        const errorData = await response.json()
        error(errorData.error || 'Failed to update video')
      }
    } catch (err) {
      console.error('Error updating video:', err)
      error('Failed to update video')
    } finally {
      setIsUpdating(false)
    }
  }

  const updateVideoStatus = async (videoId: string, status: 'approved' | 'rejected') => {
    try {
      setIsUpdating(true)
      const response = await fetch(`/api/short-videos/${videoId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      })

      if (response.ok) {
        setVideos(prev => prev.map(video => 
          video.id === videoId 
            ? { ...video, status }
            : video
        ))
        setSelectedVideo(null)
      } else {
        const errorData = await response.json()
        error(errorData.error || 'Failed to update video status')
      }
    } catch (err) {
      console.error('Error updating video status:', err)
      error('Failed to update video status')
    } finally {
      setIsUpdating(false)
    }
  }

  const deleteVideo = async (videoId: string) => {
    if (!confirm('Are you sure you want to delete this video? This action cannot be undone.')) {
      return
    }

    try {
      setIsUpdating(true)
      const response = await fetch(`/api/short-videos/${videoId}`, {
        method: 'DELETE',
      })

      if (response.ok) {
        setVideos(prev => prev.filter(video => video.id !== videoId))
        setSelectedVideo(null)
        success('Video deleted successfully')
      } else {
        const errorData = await response.json()
        error(errorData.error || 'Failed to delete video')
      }
    } catch (err) {
      console.error('Error deleting video:', err)
      error('Failed to delete video')
    } finally {
      setIsUpdating(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return 'Unknown'
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + ' ' + sizes[i]
  }

  const formatDuration = (seconds?: number) => {
    if (!seconds) return 'Unknown'
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
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

  const filteredVideos = videos.filter(video => 
    filter === 'all' || video.status === filter
  )

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-black">Short Videos Management</h1>
        
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          {/* Upload Button */}
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center justify-center px-4 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Upload Video
          </button>

          {/* Filter Tabs */}
          <div className="flex border border-gray-200 overflow-x-auto">
            {(['all', 'pending', 'approved', 'rejected'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 text-sm font-medium transition-colors whitespace-nowrap ${
                  filter === status
                    ? 'bg-black text-white'
                    : 'text-gray-600 hover:text-black hover:bg-gray-50'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
                {status !== 'all' && (
                  <span className="ml-2 text-xs">
                    ({videos.filter(v => v.status === status).length})
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Videos Grid/List */}
      <div className="bg-white border border-gray-200">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto"></div>
            <p className="mt-2 text-gray-600">Loading videos...</p>
          </div>
        ) : filteredVideos.length === 0 ? (
          <div className="p-8 text-center">
            <p className="text-gray-600">No videos found for the selected filter.</p>
          </div>
        ) : (
          <>
            {/* Desktop Table View */}
            <div className="hidden lg:block">
              <table className="w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Video
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Stats
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredVideos.map((video) => (
                    <tr key={video.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-16 w-16">
                            <video
                              src={video.videoUrl}
                              className="h-16 w-16 object-cover bg-gray-100 rounded"
                              muted
                            />
                          </div>
                          <div className="ml-4 min-w-0 flex-1">
                            <div className="text-sm font-medium text-black truncate">
                              {video.title}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {video.uploadedBy?.name || video.uploadedBy?.email || 'Unknown'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatDuration(video.duration)} • {formatFileSize(video.fileSize)}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        {getStatusBadge(video.status)}
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        <div>{video.viewCount} views</div>
                        <div>{video.likeCount} likes</div>
                      </td>
                      <td className="px-4 py-4 text-sm text-gray-500">
                        {formatDate(video.createdAt)}
                      </td>
                      <td className="px-4 py-4 text-sm font-medium">
                        <div className="flex flex-col space-y-1">
                          <button
                            onClick={() => setSelectedVideo(video)}
                            className="text-blue-600 hover:text-blue-900 text-left"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(video)}
                            className="text-green-600 hover:text-green-900 text-left"
                          >
                            Edit
                          </button>
                          {video.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateVideoStatus(video.id, 'approved')}
                                disabled={isUpdating}
                                className="text-green-600 hover:text-green-900 disabled:opacity-50 text-left"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateVideoStatus(video.id, 'rejected')}
                                disabled={isUpdating}
                                className="text-red-600 hover:text-red-900 disabled:opacity-50 text-left"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteVideo(video.id)}
                            disabled={isUpdating}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50 text-left"
                          >
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="lg:hidden divide-y divide-gray-200">
              {filteredVideos.map((video) => (
                <div key={video.id} className="p-4 hover:bg-gray-50">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <video
                        src={video.videoUrl}
                        className="h-20 w-20 object-cover bg-gray-100 rounded"
                        muted
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-medium text-black truncate">
                            {video.title}
                          </h3>
                          <p className="text-xs text-gray-500 mt-1">
                            {video.uploadedBy?.name || video.uploadedBy?.email || 'Unknown'}
                          </p>
                          <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                            <span>{video.viewCount} views</span>
                            <span>{video.likeCount} likes</span>
                            <span>{formatDuration(video.duration)}</span>
                          </div>
                        </div>
                        <div className="ml-2">
                          {getStatusBadge(video.status)}
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-xs text-gray-500">
                          {formatDate(video.createdAt)}
                        </span>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setSelectedVideo(video)}
                            className="text-xs text-blue-600 hover:text-blue-900"
                          >
                            View
                          </button>
                          <button
                            onClick={() => openEditModal(video)}
                            className="text-xs text-green-600 hover:text-green-900"
                          >
                            Edit
                          </button>
                          {video.status === 'pending' && (
                            <>
                              <button
                                onClick={() => updateVideoStatus(video.id, 'approved')}
                                disabled={isUpdating}
                                className="text-xs text-green-600 hover:text-green-900 disabled:opacity-50"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => updateVideoStatus(video.id, 'rejected')}
                                disabled={isUpdating}
                                className="text-xs text-red-600 hover:text-red-900 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </>
                          )}
                          <button
                            onClick={() => deleteVideo(video.id)}
                            disabled={isUpdating}
                            className="text-xs text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Upload Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-black">Upload New Video</h3>
                <button
                  onClick={() => setShowUploadModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <VideoUploadForm onSuccess={handleUploadSuccess} />
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && selectedVideo && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-2xl w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-black">Edit Video</h3>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <label htmlFor="edit-title" className="block text-sm font-medium text-black mb-2">
                    Title *
                  </label>
                  <input
                    type="text"
                    id="edit-title"
                    value={editFormData.title}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, title: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
                    required
                  />
                </div>

                <div>
                  <label htmlFor="edit-description" className="block text-sm font-medium text-black mb-2">
                    Description
                  </label>
                  <textarea
                    id="edit-description"
                    value={editFormData.description}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
                  />
                </div>

                <div>
                  <label htmlFor="edit-status" className="block text-sm font-medium text-black mb-2">
                    Status
                  </label>
                  <select
                    id="edit-status"
                    value={editFormData.status}
                    onChange={(e) => setEditFormData(prev => ({ ...prev, status: e.target.value as 'pending' | 'approved' | 'rejected' }))}
                    className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditModal(false)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdating}
                    className="px-4 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                  >
                    {isUpdating ? 'Updating...' : 'Update Video'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Video Preview Modal */}
      {selectedVideo && !showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-black">
                  {selectedVideo.title}
                </h3>
                <button
                  onClick={() => setSelectedVideo(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="aspect-video bg-black mb-4">
                <video
                  src={selectedVideo.videoUrl}
                  controls
                  className="w-full h-full"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Status: </span>
                    {getStatusBadge(selectedVideo.status)}
                  </div>
                  
                  {selectedVideo.description && (
                    <div>
                      <span className="font-medium">Description: </span>
                      <p className="text-gray-600">{selectedVideo.description}</p>
                    </div>
                  )}

                  <div>
                    <span className="font-medium">Uploader: </span>
                    {selectedVideo.uploadedBy?.name || selectedVideo.uploadedBy?.email || 'Unknown'}
                  </div>

                  <div>
                    <span className="font-medium">Uploaded: </span>
                    {formatDate(selectedVideo.createdAt)}
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <span className="font-medium">Duration: </span>
                    {formatDuration(selectedVideo.duration)}
                  </div>

                  <div>
                    <span className="font-medium">File Size: </span>
                    {formatFileSize(selectedVideo.fileSize)}
                  </div>

                  <div>
                    <span className="font-medium">Views: </span>
                    {selectedVideo.viewCount.toLocaleString()}
                  </div>

                  <div>
                    <span className="font-medium">Likes: </span>
                    {selectedVideo.likeCount.toLocaleString()}
                  </div>
                </div>
              </div>

              {selectedVideo.status === 'pending' && (
                <div className="flex space-x-3 pt-6 border-t border-gray-200 mt-6">
                  <button
                    onClick={() => updateVideoStatus(selectedVideo.id, 'approved')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => updateVideoStatus(selectedVideo.id, 'rejected')}
                    disabled={isUpdating}
                    className="px-4 py-2 bg-red-600 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                  >
                    Reject
                  </button>
                  <button
                    onClick={() => openEditModal(selectedVideo)}
                    className="px-4 py-2 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                  >
                    Edit Details
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

// Simplified upload form component for the modal
function VideoUploadForm({ onSuccess }: { onSuccess: () => void }) {
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [isUploading, setIsUploading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!file || !title.trim()) {
      setMessage({ type: 'error', text: 'Please select a file and enter a title.' })
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('video', file)
      formData.append('title', title.trim())
      formData.append('description', description.trim())

      const response = await fetch('/api/short-videos/upload', {
        method: 'POST',
        body: formData,
      })

      if (response.ok) {
        const result = await response.json()
        setMessage({ type: 'success', text: result.message })
        setFile(null)
        setTitle('')
        setDescription('')
        setTimeout(() => {
          onSuccess()
        }, 1500)
      } else {
        const error = await response.json()
        setMessage({ type: 'error', text: error.error })
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Upload failed. Please try again.' })
    } finally {
      setIsUploading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Video File *
        </label>
        <input
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
          required
        />
        <p className="text-xs text-gray-500 mt-1">Max 100MB. Supported: MP4, WebM, QuickTime, AVI</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Title *
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-black mb-2">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
        />
      </div>

      {message && (
        <div className={`p-4 border ${
          message.type === 'success' 
            ? 'bg-green-50 text-green-800 border-green-200' 
            : 'bg-red-50 text-red-800 border-red-200'
        }`}>
          {message.text}
        </div>
      )}

      <div className="flex justify-end space-x-3">
        <button
          type="submit"
          disabled={isUploading || !file || !title.trim()}
          className="px-6 py-2 bg-black text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
        >
          {isUploading ? 'Uploading...' : 'Upload Video'}
        </button>
      </div>
    </form>
  )
}