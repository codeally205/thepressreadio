'use client'

import { useState, useRef } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import LoadingButton from '@/components/ui/LoadingButton'

interface UploadProgress {
  loaded: number
  total: number
  percentage: number
}

export default function VideoUpload() {
  const { data: session } = useSession()
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<UploadProgress | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null)

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

    const files = e.dataTransfer.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleFileSelect = (file: File) => {
    // Validate file type
    const allowedTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo']
    if (!allowedTypes.includes(file.type)) {
      setMessage({
        type: 'error',
        text: 'Invalid file type. Only MP4, WebM, QuickTime, and AVI files are allowed.'
      })
      return
    }

    // Validate file size (100MB for Cloudinary)
    const maxSize = 100 * 1024 * 1024
    if (file.size > maxSize) {
      setMessage({
        type: 'error',
        text: 'File too large. Maximum size is 100MB.'
      })
      return
    }

    setSelectedFile(file)
    setMessage(null)
  }

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files[0]) {
      handleFileSelect(files[0])
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !title.trim()) {
      setMessage({
        type: 'error',
        text: 'Please select a video file and enter a title.'
      })
      return
    }

    if (!session?.user) {
      router.push('/login')
      return
    }

    setIsUploading(true)
    setMessage(null)

    try {
      const formData = new FormData()
      formData.append('video', selectedFile)
      formData.append('title', title.trim())
      formData.append('description', description.trim())

      const xhr = new XMLHttpRequest()

      // Track upload progress
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const percentage = Math.round((e.loaded / e.total) * 100)
          setUploadProgress({
            loaded: e.loaded,
            total: e.total,
            percentage
          })
        }
      })

      // Handle completion
      xhr.addEventListener('load', () => {
        if (xhr.status === 200) {
          const response = JSON.parse(xhr.responseText)
          setMessage({
            type: 'success',
            text: response.message || 'Video uploaded successfully!'
          })
          // Reset form
          setSelectedFile(null)
          setTitle('')
          setDescription('')
          setUploadProgress(null)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        } else {
          const error = JSON.parse(xhr.responseText)
          setMessage({
            type: 'error',
            text: error.error || 'Upload failed. Please try again.'
          })
        }
        setIsUploading(false)
      })

      // Handle errors
      xhr.addEventListener('error', () => {
        setMessage({
          type: 'error',
          text: 'Upload failed. Please check your connection and try again.'
        })
        setIsUploading(false)
      })

      xhr.open('POST', '/api/short-videos/upload')
      xhr.send(formData)

    } catch (error) {
      console.error('Upload error:', error)
      setMessage({
        type: 'error',
        text: 'Upload failed. Please try again.'
      })
      setIsUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  if (!session?.user) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 p-8 max-w-md mx-auto">
          <h3 className="text-lg font-medium text-black mb-4">Sign In Required</h3>
          <p className="text-gray-600 mb-6">
            You need to sign in to upload short videos.
          </p>
          <LoadingButton
            onClick={() => router.push('/login')}
            variant="primary"
            className="px-6 py-2"
          >
            Sign In
          </LoadingButton>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white border border-gray-200 p-8">
        <h2 className="text-2xl font-bold text-black mb-6">Upload Short Video</h2>

        {/* File Upload Area */}
        <div
          className={`border-2 border-dashed p-8 text-center transition-colors ${
            dragActive
              ? 'border-black bg-gray-50'
              : selectedFile
              ? 'border-green-500 bg-green-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div>
              <svg className="w-12 h-12 text-green-600 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-black mb-2">{selectedFile.name}</p>
              <p className="text-sm text-gray-600">{formatFileSize(selectedFile.size)}</p>
              <button
                onClick={() => {
                  setSelectedFile(null)
                  if (fileInputRef.current) fileInputRef.current.value = ''
                }}
                className="mt-4 text-sm text-red-600 hover:text-red-800 underline"
              >
                Remove file
              </button>
            </div>
          ) : (
            <div>
              <svg className="w-12 h-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-lg font-medium text-black mb-2">
                Drag and drop your video here
              </p>
              <p className="text-sm text-gray-600 mb-4">
                or click to browse files
              </p>
              <button
                onClick={() => fileInputRef.current?.click()}
                className="px-4 py-2 border border-gray-300 text-gray-700 hover:border-black hover:text-black transition-colors"
              >
                Choose File
              </button>
              <p className="text-xs text-gray-500 mt-4">
                Supported formats: MP4, WebM, QuickTime, AVI (Max 100MB)
              </p>
            </div>
          )}
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="video/mp4,video/webm,video/quicktime,video/x-msvideo"
          onChange={handleFileInputChange}
          className="hidden"
        />

        {/* Form Fields */}
        <div className="mt-6 space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-black mb-2">
              Title *
            </label>
            <input
              type="text"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter video title"
              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
              disabled={isUploading}
            />
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-black mb-2">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter video description (optional)"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
              disabled={isUploading}
            />
          </div>
        </div>

        {/* Upload Progress */}
        {uploadProgress && (
          <div className="mt-6">
            <div className="flex justify-between text-sm text-gray-600 mb-2">
              <span>Uploading...</span>
              <span>{uploadProgress.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 h-2">
              <div
                className="bg-black h-2 transition-all duration-300"
                style={{ width: `${uploadProgress.percentage}%` }}
              />
            </div>
          </div>
        )}

        {/* Messages */}
        {message && (
          <div className={`mt-6 p-4 border ${
            message.type === 'success'
              ? 'bg-green-50 text-green-800 border-green-200'
              : 'bg-red-50 text-red-800 border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Upload Button */}
        <div className="mt-6">
          <button
            onClick={handleUpload}
            disabled={!selectedFile || !title.trim() || isUploading}
            className="w-full px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 focus:ring-2 focus:ring-black focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isUploading ? 'Uploading...' : 'Upload Video'}
          </button>
        </div>

        {/* Info */}
        <div className="mt-6 text-sm text-gray-600">
          <p className="mb-2">
            <strong>Note:</strong> {session.user.role === 'admin' || session.user.role === 'editor' 
              ? 'Your videos will be published immediately.'
              : 'Your videos will be reviewed before being published.'
            }
          </p>
          <ul className="list-disc list-inside space-y-1">
            <li>Maximum file size: 100MB</li>
            <li>Supported formats: MP4, WebM, QuickTime, AVI</li>
            <li>Recommended resolution: 1080x1920 (vertical) or 1920x1080 (horizontal)</li>
            <li>Videos are stored securely on Cloudinary</li>
          </ul>
        </div>
      </div>
    </div>
  )
}