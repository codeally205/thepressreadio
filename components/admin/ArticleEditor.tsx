'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useOptimizedSession } from '@/hooks/useOptimizedSession'
import VideoUpload from './VideoUpload'
import ImageUpload from './ImageUpload'
import { useToast } from '@/components/ui/Toast'
import LoadingButton from '@/components/ui/LoadingButton'
import { 
  PhotoIcon, 
  VideoCameraIcon, 
  EyeIcon, 
  DocumentTextIcon,
  CalendarIcon,
  TagIcon,
  GlobeAltIcon,
  LockClosedIcon
} from '@heroicons/react/24/outline'

interface Article {
  id?: string
  title: string
  slug: string
  excerpt: string
  body: any
  category: string
  accessLevel: string
  status: string
  coverImageUrl?: string
  videoUrl?: string
  videoThumbnailUrl?: string
  videoDuration?: number
  videoType?: string
  publishedAt?: Date
  scheduledFor?: Date
  metaTitle?: string
  metaDescription?: string
  ogImageUrl?: string
}

interface ArticleEditorProps {
  article?: Article
}

const categories = [
  'politics',
  'economy',
  'technology',
  'business',
  'environment',
  'culture',
  'sports',
  'health',
  'education'
]

export default function ArticleEditor({ article }: ArticleEditorProps) {
  const router = useRouter()
  const { user } = useOptimizedSession()
  const { success, error } = useToast()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('content')
  const [selectedMediaType, setSelectedMediaType] = useState<'image' | 'video' | null>(null)
  
  // Form state
  const [formData, setFormData] = useState<Article>({
    title: article?.title || '',
    slug: article?.slug || '',
    excerpt: article?.excerpt || '',
    body: article?.body || { type: 'doc', content: [] },
    category: article?.category || 'politics',
    accessLevel: article?.accessLevel || 'free',
    status: article?.status || 'draft',
    coverImageUrl: article?.coverImageUrl || '',
    videoUrl: article?.videoUrl || '',
    videoThumbnailUrl: article?.videoThumbnailUrl || '',
    videoDuration: article?.videoDuration || 0,
    videoType: article?.videoType || '',
    publishedAt: article?.publishedAt,
    scheduledFor: article?.scheduledFor,
    metaTitle: article?.metaTitle || '',
    metaDescription: article?.metaDescription || '',
    ogImageUrl: article?.ogImageUrl || '',
  })

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !article) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '')
      setFormData(prev => ({ ...prev, slug }))
    }
  }, [formData.title, article])

  // Set initial media type based on existing data
  useEffect(() => {
    if (article) {
      if (article.videoUrl || article.videoType) {
        setSelectedMediaType('video')
      } else if (article.coverImageUrl) {
        setSelectedMediaType('image')
      }
    }
  }, [article])
  const handleInputChange = (field: keyof Article, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleVideoUrlChange = (url: string) => {
    let videoType = ''
    if (url.includes('youtube.com') || url.includes('youtu.be')) {
      videoType = 'youtube'
    } else if (url.includes('vimeo.com')) {
      videoType = 'vimeo'
    } else if (url) {
      videoType = 'upload'
    }
    
    setFormData(prev => ({ 
      ...prev, 
      videoUrl: url,
      videoType 
    }))
  }

  const handleSave = async (publishStatus: string = formData.status) => {
    setIsLoading(true)
    try {
      // Validate required fields
      if (!formData.title.trim()) {
        error('Please enter a title')
        setIsLoading(false)
        return
      }
      
      if (!formData.slug.trim()) {
        error('Please enter a URL slug')
        setIsLoading(false)
        return
      }
      
      if (!formData.category) {
        error('Please select a category')
        setIsLoading(false)
        return
      }

      const payload = {
        ...formData,
        status: publishStatus,
        publishedAt: publishStatus === 'published' ? new Date() : formData.publishedAt,
      }

      console.log('Saving article with payload:', payload)

      const url = article ? `/api/admin/articles/${article.id}` : '/api/admin/articles'
      const method = article ? 'PUT' : 'POST'

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const result = await response.json()
      console.log('API Response:', result)

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save article')
      }
      
      if (!article) {
        router.push(`/admin/articles/${result.id}/edit`)
      } else {
        router.refresh()
      }
      
      // Show success message
      success(`Article ${publishStatus === 'published' ? 'published' : 'saved'} successfully!`)
    } catch (err) {
      console.error('Error saving article:', err)
      error(`Failed to save article: ${err instanceof Error ? err.message : 'Unknown error'}`)
    } finally {
      setIsLoading(false)
    }
  }
  const tabs = [
    { id: 'content', name: 'Content', icon: DocumentTextIcon },
    { id: 'media', name: 'Media', icon: PhotoIcon },
    { id: 'settings', name: 'Settings', icon: GlobeAltIcon },
    { id: 'seo', name: 'SEO', icon: TagIcon },
  ]

  return (
    <div className="bg-white shadow rounded-lg">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <input
              type="text"
              placeholder="Article title..."
              value={formData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              className="text-xl font-semibold bg-transparent border-none outline-none placeholder-gray-400 flex-1 min-w-0"
            />
          </div>
          <div className="flex items-center space-x-3">
            <LoadingButton
              onClick={() => handleSave('draft')}
              loading={isLoading}
              loadingText="Saving..."
              variant="secondary"
              size="sm"
            >
              Save Draft
            </LoadingButton>
            <LoadingButton
              onClick={() => handleSave('published')}
              loading={isLoading}
              loadingText={formData.status === 'published' ? 'Updating...' : 'Publishing...'}
              variant="primary"
              size="sm"
            >
              {formData.status === 'published' ? 'Update' : 'Publish'}
            </LoadingButton>
          </div>
        </div>
      </div>
      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          {tabs.map((tab) => {
            const Icon = tab.icon
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
              </button>
            )
          })}
        </nav>
      </div>
      {/* Tab Content */}
      <div className="p-6">
        {activeTab === 'content' && (
          <div className="space-y-6">
            {/* Slug */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL Slug
              </label>
              <input
                type="text"
                value={formData.slug}
                onChange={(e) => handleInputChange('slug', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="article-url-slug"
              />
            </div>

            {/* Excerpt */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Excerpt
              </label>
              <textarea
                value={formData.excerpt}
                onChange={(e) => handleInputChange('excerpt', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Brief description of the article..."
              />
            </div>

            {/* Content Editor */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Content
              </label>
              <div className="border border-gray-300 rounded-md">
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                  <div className="flex items-center space-x-2 text-sm text-gray-600">
                    <DocumentTextIcon className="w-4 h-4" />
                    <span>Rich text editor would go here</span>
                  </div>
                </div>
                <textarea
                  value={typeof formData.body === 'string' ? formData.body : JSON.stringify(formData.body, null, 2)}
                  onChange={(e) => {
                    try {
                      const parsed = JSON.parse(e.target.value)
                      handleInputChange('body', parsed)
                    } catch {
                      handleInputChange('body', e.target.value)
                    }
                  }}
                  rows={15}
                  className="w-full px-4 py-3 border-none outline-none resize-none"
                  placeholder="Write your article content here..."
                />
              </div>
            </div>
          </div>
        )}
        {activeTab === 'media' && (
          <div className="space-y-6">
            {/* Media Type Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Article Media Type
              </label>
              <div className="flex space-x-4">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMediaType('image')
                    setFormData(prev => ({
                      ...prev,
                      videoUrl: '',
                      videoThumbnailUrl: '',
                      videoDuration: 0,
                      videoType: ''
                    }))
                  }}
                  className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
                    selectedMediaType === 'image'
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <PhotoIcon className="w-5 h-5 mr-2" />
                  Image Article
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedMediaType('video')
                    setFormData(prev => ({
                      ...prev,
                      coverImageUrl: ''
                    }))
                  }}
                  className={`flex items-center px-4 py-2 rounded-md border transition-colors ${
                    selectedMediaType === 'video'
                      ? 'bg-blue-50 border-blue-200 text-blue-700' 
                      : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <VideoCameraIcon className="w-5 h-5 mr-2" />
                  Video Article
                </button>
              </div>
            </div>
            {/* Image Section */}
            {selectedMediaType === 'image' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Cover Image
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Image URL
                    </label>
                    <input
                      type="url"
                      value={formData.coverImageUrl}
                      onChange={(e) => handleInputChange('coverImageUrl', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://example.com/image.jpg"
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Upload Image File
                    </label>
                    <ImageUpload
                      currentImageUrl={formData.coverImageUrl}
                      onImageUploaded={(imageUrl) => {
                        handleInputChange('coverImageUrl', imageUrl)
                        success('Image uploaded successfully!')
                      }}
                      label="Cover Image"
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Video Section */}
            {selectedMediaType === 'video' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Video
                </label>
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Video URL (YouTube, Vimeo, etc.)
                    </label>
                    <input
                      type="url"
                      value={formData.videoUrl}
                      onChange={(e) => {
                        handleVideoUrlChange(e.target.value)
                        if (e.target.value) {
                          success('Video URL added successfully!')
                        }
                      }}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                    />
                  </div>
                  <div className="relative">
                    <div className="absolute inset-0 flex items-center">
                      <div className="w-full border-t border-gray-300" />
                    </div>
                    <div className="relative flex justify-center text-sm">
                      <span className="px-2 bg-white text-gray-500">OR</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">
                      Upload Video File
                    </label>
                    <VideoUpload
                      currentVideoUrl={formData.videoType === 'upload' ? formData.videoUrl : ''}
                      onVideoUploaded={(videoUrl, thumbnailUrl, duration) => {
                        setFormData(prev => ({
                          ...prev,
                          videoUrl,
                          videoDuration: duration || prev.videoDuration,
                          videoType: 'upload'
                        }))
                        success('Video uploaded successfully!')
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
            {/* Show message when no media type is selected */}
            {!selectedMediaType && (
              <div className="text-center py-8 bg-gray-50 rounded-md border-2 border-dashed border-gray-300">
                <div className="flex justify-center space-x-4 mb-4">
                  <PhotoIcon className="w-12 h-12 text-gray-400" />
                  <VideoCameraIcon className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-gray-500">Choose to add either an image or video to your article</p>
              </div>
            )}
          </div>
        )}
        {activeTab === 'settings' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <select
                  value={formData.category}
                  onChange={(e) => handleInputChange('category', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((category) => (
                    <option key={category} value={category}>
                      {category.charAt(0).toUpperCase() + category.slice(1)}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Access Level
                </label>
                <select
                  value={formData.accessLevel}
                  onChange={(e) => handleInputChange('accessLevel', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="free">Free</option>
                  <option value="premium">Premium</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Status
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => handleInputChange('status', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="archived">Archived</option>
                </select>
              </div>
            </div>
          </div>
        )}
        {activeTab === 'seo' && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Title
              </label>
              <input
                type="text"
                value={formData.metaTitle}
                onChange={(e) => handleInputChange('metaTitle', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SEO title for search engines"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Meta Description
              </label>
              <textarea
                value={formData.metaDescription}
                onChange={(e) => handleInputChange('metaDescription', e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="SEO description for search engines"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Social Media Image (OG Image)
              </label>
              <div className="space-y-4">
                <div>
                  <input
                    type="url"
                    value={formData.ogImageUrl}
                    onChange={(e) => handleInputChange('ogImageUrl', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="https://example.com/og-image.jpg"
                  />
                </div>
                <ImageUpload
                  currentImageUrl={formData.ogImageUrl}
                  onImageUploaded={(imageUrl) => handleInputChange('ogImageUrl', imageUrl)}
                  label="OG Image"
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}