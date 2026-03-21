'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import AdImageUpload from '@/components/admin/AdImageUpload'

interface Ad {
  id: string
  title: string
  description: string | null
  imageUrl: string | null
  linkUrl: string | null
  buttonText: string | null
  position: string
  status: string
  priority: number
  startDate: Date | string | null
  endDate: Date | string | null
  targetAudience: string
}

interface AdEditFormProps {
  ad: Ad
}

export default function AdEditForm({ ad }: AdEditFormProps) {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const formatDateForInput = (date: Date | string | null): string => {
    if (!date) return ''
    try {
      const dateObj = typeof date === 'string' ? new Date(date) : date
      if (isNaN(dateObj.getTime())) return ''
      return dateObj.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  const [formData, setFormData] = useState({
    title: ad.title,
    description: ad.description || '',
    imageUrl: ad.imageUrl || '',
    linkUrl: ad.linkUrl || '',
    buttonText: ad.buttonText || 'Learn More',
    position: ad.position,
    status: ad.status,
    priority: ad.priority,
    startDate: formatDateForInput(ad.startDate),
    endDate: formatDateForInput(ad.endDate),
    targetAudience: ad.targetAudience,
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    console.log('Form submission - Current formData:', {
      position: formData.position,
      priority: formData.priority,
      title: formData.title
    })

    try {
      const payload = {
        ...formData,
        priority: parseInt(formData.priority.toString()),
        startDate: formData.startDate || null,
        endDate: formData.endDate || null,
      }

      console.log('Sending payload to API:', {
        position: payload.position,
        priority: payload.priority
      })

      const response = await fetch(`/api/admin/ads/${ad.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        const result = await response.json()
        console.log('API response:', {
          position: result.position,
          priority: result.priority
        })
        router.push('/admin/ads')
        router.refresh()
      } else {
        const error = await response.json()
        alert(`Failed to update ad: ${error.error}`)
      }
    } catch (error) {
      console.error('Failed to update ad:', error)
      alert('Failed to update ad. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <Link
          href="/admin/ads"
          className="inline-flex items-center text-sm text-gray-600 hover:text-black"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Ads
        </Link>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-black mb-4">Ad Details</h3>
          
          <div className="grid grid-cols-1 gap-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter ad title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                value={formData.description}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Enter ad description"
              />
            </div>

            <AdImageUpload
              currentImageUrl={formData.imageUrl}
              onImageChange={(url) => setFormData(prev => ({ ...prev, imageUrl: url }))}
              onImageRemove={() => setFormData(prev => ({ ...prev, imageUrl: '' }))}
            />

            <div>
              <label htmlFor="linkUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Link URL
              </label>
              <input
                type="url"
                id="linkUrl"
                name="linkUrl"
                value={formData.linkUrl}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="https://example.com"
              />
            </div>

            <div>
              <label htmlFor="buttonText" className="block text-sm font-medium text-gray-700 mb-2">
                Button Text
              </label>
              <input
                type="text"
                id="buttonText"
                name="buttonText"
                value={formData.buttonText}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="Learn More"
              />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 p-6">
          <h3 className="text-lg font-medium text-black mb-4">Settings</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                id="status"
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="scheduled">Scheduled</option>
              </select>
            </div>

            <div>
              <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-2">
                Priority
              </label>
              <input
                type="number"
                id="priority"
                name="priority"
                min="0"
                max="100"
                value={formData.priority}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
                placeholder="0"
              />
              <p className="text-xs text-gray-500 mt-1">Higher numbers appear first</p>
            </div>

            <div>
              <label htmlFor="position" className="block text-sm font-medium text-gray-700 mb-2">
                Position
              </label>
              <select
                id="position"
                name="position"
                value={formData.position}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="sidebar">Sidebar</option>
                <option value="inline">Article Content</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Current: {formData.position}</p>
            </div>

            <div>
              <label htmlFor="targetAudience" className="block text-sm font-medium text-gray-700 mb-2">
                Target Audience
              </label>
              <select
                id="targetAudience"
                name="targetAudience"
                value={formData.targetAudience}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              >
                <option value="unsubscribed">Unsubscribed Users Only</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">Ads are only shown to users without active subscriptions</p>
            </div>

            <div>
              <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-2">
                Start Date (Optional)
              </label>
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={formData.startDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>

            <div>
              <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={formData.endDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 focus:outline-none focus:ring-2 focus:ring-black focus:border-transparent"
              />
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Link
            href="/admin/ads"
            className="px-4 py-2 border border-gray-300 text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="px-4 py-2 border border-black text-sm font-medium text-white bg-black hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-black disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? 'Updating...' : 'Update Ad'}
          </button>
        </div>
      </form>
    </div>
  )
}