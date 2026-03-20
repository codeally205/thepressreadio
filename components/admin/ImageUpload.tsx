'use client'

import { useState, useRef } from 'react'
import { useToast } from '@/components/ui/Toast'
import { PhotoIcon, CloudArrowUpIcon, XMarkIcon } from '@heroicons/react/24/outline'
import Image from 'next/image'

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string) => void
  currentImageUrl?: string
  className?: string
  label?: string
}

export default function ImageUpload({ 
  onImageUploaded, 
  currentImageUrl, 
  className = '',
  label = 'Upload Image'
}: ImageUploadProps) {
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
      handleImageUpload(e.dataTransfer.files[0])
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageUpload(e.target.files[0])
    }
  }

  const handleImageUpload = async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      error('Please select an image file')
      return
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      error('Image file is too large. Maximum size is 10MB.')
      return
    }

    setIsUploading(true)
    setUploadProgress(0)

    try {
      // Create FormData for file upload
      const formData = new FormData()
      formData.append('file', file)

      // Upload with progress tracking
      const xhr = new XMLHttpRequest()
      
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100)
          setUploadProgress(progress)
        }
      })

      const uploadPromise = new Promise<string>((resolve, reject) => {
        xhr.onload = () => {
          if (xhr.status === 200) {
            const response = JSON.parse(xhr.responseText)
            resolve(response.url)
          } else {
            reject(new Error('Upload failed'))
          }
        }
        xhr.onerror = () => reject(new Error('Upload failed'))
      })

      xhr.open('POST', '/api/admin/upload')
      xhr.send(formData)

      const imageUrl = await uploadPromise
      
      onImageUploaded(imageUrl)
      setIsUploading(false)
      setUploadProgress(0)
    } catch (err) {
      console.error('Error uploading image:', err)
      error('Failed to upload image. Please try again.')
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const removeImage = () => {
    onImageUploaded('')
  }

  if (currentImageUrl) {
    return (
      <div className={`relative ${className}`}>
        <div className="relative bg-gray-100 rounded-lg overflow-hidden">
          <Image
            src={currentImageUrl}
            alt="Uploaded image"
            width={300}
            height={200}
            className="w-full h-48 object-cover"
          />
          <button
            onClick={removeImage}
            className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          {label} uploaded successfully
        </p>
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
          accept="image/*"
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
            <PhotoIcon className="mx-auto h-12 w-12 text-gray-400" />
            <div>
              <p className="text-sm font-medium text-gray-900">
                Drop your image here, or{' '}
                <button
                  type="button"
                  className="text-blue-600 hover:text-blue-500"
                  onClick={() => fileInputRef.current?.click()}
                >
                  browse
                </button>
              </p>
              <p className="text-xs text-gray-500 mt-1">
                PNG, JPG, GIF up to 10MB
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}