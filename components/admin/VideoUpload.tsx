'use client'

import { useState, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import { VideoCameraIcon, CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface VideoUploadProps {
  onVideoUploaded: (videoUrl: string, thumbnailUrl?: string, duration?: number) => void
  currentVideoUrl?: string
  className?: string
}

export default function VideoUpload({ onVideoUploaded, currentVideoUrl, className = '' }: VideoUploadProps) {
  const { success, error } = useToast()
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleVideoUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleVideoUpload(e.target.files[0])
    }
  }

  const handleVideoUpload = async (file: File) => {
    console.log('Starting video upload:', file.name, file.type, file.size)
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      error('Please select a video file')
      return
    }

    // Validate file size (max 100MB for example)
    const maxSize = 100 * 1024 * 1024 // 100MB
    if (file.size > maxSize) {
      error('Video file is too large. Maximum size is 100MB.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)

      console.log('Sending video to upload API...')

      // Upload with progress tracking
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          console.log('Upload progress:', progress + '%')
          setUploadProgress(progress)
        }
      })

      const uploadPromise = new Promise<any>((resolve, reject) => {
        xhr.onload = () => {
          console.log('Upload response status:', xhr.status)
          console.log('Upload response text:', xhr.responseText)
          
          if (xhr.status === 200) {
            try {
              const response = JSON.parse(xhr.responseText)
              console.log('Parsed upload response:', response)
              resolve(response)
            } catch (parseError) {
              console.error('Failed to parse response:', parseError)
              reject(new Error('Invalid response from server'))
            }
          } else {
            try {
              const errorResponse = JSON.parse(xhr.responseText)
              console.error('Upload error response:', errorResponse)
              reject(new Error(errorResponse.error || 'Upload failed'))
            } catch (parseError) {
              console.error('Failed to parse error response:', parseError)
              reject(new Error(`Upload failed with status ${xhr.status}`))
            }
          }
        }
        
        xhr.onerror = (error) => {
          console.error('XHR error:', error)
          reject(new Error('Network error during upload'))
        }
        
        xhr.ontimeout = () => {
          console.error('Upload timeout')
          reject(new Error('Upload timeout'))
        }
      })

      xhr.open('POST', '/api/admin/upload')
      xhr.timeout = 120000 // 2 minute timeout
      xhr.send(formData)

      const uploadResponse = await uploadPromise
      console.log('Video upload successful:', uploadResponse)
      
      // Extract video URL and duration from Cloudinary response
      const videoUrl = uploadResponse.url
      const duration = uploadResponse.duration || 0
      
      console.log('Calling onVideoUploaded with:', { videoUrl, duration })
      
      // Call the callback with just the video URL and duration (no thumbnail)
      onVideoUploaded(videoUrl, undefined, duration)
      
      console.log('Video upload completed successfully - no thumbnail needed')
      setIsUploading(false)
      setUploadProgress(0)
      
    } catch (err) {
      console.error('Error uploading video:', err)
      error(`Failed to upload video: ${err instanceof Error ? err.message : 'Unknown error'}`)
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const removeVideo = () => {
    onVideoUploaded('', '', 0)
  }

  if (currentVideoUrl) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <video
            src={currentVideoUrl}
            controls
            className="w-full h-48 object-cover"
          />
          <button
            onClick={removeVideo}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <div className="mt-2">
          <p className="text-sm font-medium text-green-600">
            ✅ Video uploaded successfully!
          </p>
          <p className="text-xs text-gray-500 mt-1 break-all">
            URL: {currentVideoUrl}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={className}>
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
          dragActive
            ? 'border-blue-400 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
        />
        
        {isUploading ? (
          <div className="space-y-4">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-blue-500" />
            <div>
              <p className="text-sm font-medium text-gray-900">Uploading to Cloudinary...</p>
              <div className="mt-2 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-1 text-xs text-gray-500">{uploadProgress}%</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <VideoCameraIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drop your video here, or{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                MP4, WebM, AVI up to 100MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}