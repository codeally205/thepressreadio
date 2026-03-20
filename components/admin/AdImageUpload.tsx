'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { PhotoIcon, XMarkIcon, ClipboardDocumentIcon } from '@heroicons/react/24/outline'
import { useToast } from '@/components/ui/Toast'

interface AdImageUploadProps {
  currentImageUrl?: string
  onImageChange: (imageUrl: string) => void
  onImageRemove: () => void
}

export default function AdImageUpload({ currentImageUrl, onImageChange, onImageRemove }: AdImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentImageUrl || null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { success, error } = useToast()

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setUploadError('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      error('Please select a valid image file (JPEG, PNG, GIF, or WebP)')
      return
    }

    // Validate file size (max 10MB for ads)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setUploadError('Image must be smaller than 10MB')
      error('Image must be smaller than 10MB')
      return
    }

    setIsUploading(true)
    setUploadError(null)

    // Show preview immediately
    const localPreviewUrl = URL.createObjectURL(file)
    setPreviewUrl(localPreviewUrl)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/admin/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const result = await response.json()
      
      // Clean up local preview URL
      URL.revokeObjectURL(localPreviewUrl)
      
      // Update with Cloudinary URL
      setPreviewUrl(result.url)
      onImageChange(result.url)
      
      // Show success toast with URL
      success(`Image uploaded successfully!`)
      
      // Also show the URL in console for debugging
      console.log('Uploaded image URL:', result.url)
      
    } catch (uploadError) {
      console.error('Upload error:', uploadError)
      setUploadError(uploadError instanceof Error ? uploadError.message : 'Upload failed')
      error(uploadError instanceof Error ? uploadError.message : 'Upload failed')
      
      // Clean up preview on error
      URL.revokeObjectURL(localPreviewUrl)
      setPreviewUrl(currentImageUrl || null)
    } finally {
      setIsUploading(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveImage = () => {
    setPreviewUrl(null)
    onImageRemove()
    setUploadError(null)
  }

  const handleUploadClick = () => {
    fileInputRef.current?.click()
  }

  const copyUrlToClipboard = async () => {
    if (previewUrl) {
      try {
        await navigator.clipboard.writeText(previewUrl)
        success('Image URL copied to clipboard!')
      } catch (err) {
        error('Failed to copy URL to clipboard')
      }
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="block text-sm font-medium text-gray-700">
          Ad Image
        </label>
        {previewUrl && (
          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={copyUrlToClipboard}
              className="text-blue-600 hover:text-blue-800 text-sm flex items-center gap-1"
              title="Copy image URL"
            >
              <ClipboardDocumentIcon className="w-4 h-4" />
              Copy URL
            </button>
            <button
              type="button"
              onClick={handleRemoveImage}
              className="text-red-600 hover:text-red-800 text-sm"
            >
              Remove Image
            </button>
          </div>
        )}
      </div>

      {previewUrl ? (
        <div className="relative">
          <div className="aspect-[16/9] relative overflow-hidden bg-gray-100 border border-gray-300 rounded-lg">
            <Image
              src={previewUrl}
              alt="Ad preview"
              fill
              className="object-cover"
              onError={() => {
                setPreviewUrl(null)
                setUploadError('Failed to load image preview')
                error('Failed to load image preview')
              }}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                <div className="text-center text-white">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                  <p className="text-sm">Uploading to cloud...</p>
                </div>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemoveImage}
            className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1 hover:bg-red-700 transition-colors"
            disabled={isUploading}
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onClick={handleUploadClick}
          className="aspect-[16/9] border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-gray-400 transition-colors bg-gray-50"
        >
          {isUploading ? (
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-2"></div>
              <p className="text-sm text-gray-600">Uploading...</p>
            </div>
          ) : (
            <div className="text-center">
              <PhotoIcon className="w-12 h-12 text-gray-400 mx-auto mb-2" />
              <p className="text-sm text-gray-600 mb-1">Click to upload an image</p>
              <p className="text-xs text-gray-500">JPEG, PNG, GIF, or WebP up to 10MB</p>
            </div>
          )}
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp"
        onChange={handleFileSelect}
        className="hidden"
        disabled={isUploading}
      />

      {uploadError && (
        <div className="text-red-600 text-sm bg-red-50 border border-red-200 rounded p-2">
          {uploadError}
        </div>
      )}

      {previewUrl && (
        <div className="text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-2">
          <p className="font-medium mb-1">Image URL:</p>
          <p className="break-all font-mono">{previewUrl}</p>
        </div>
      )}

      <div className="text-xs text-gray-500">
        Recommended size: 400x225 pixels (16:9 aspect ratio) for best display quality
      </div>
    </div>
  )
}