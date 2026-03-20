'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CalendarIcon } from '@heroicons/react/24/outline'

interface Newsletter {
  id: string
  subject: string
  previewText: string | null
  sentAt: string
}

export default function NewsletterArchive() {
  const [newsletters, setNewsletters] = useState<Newsletter[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetchNewsletters()
  }, [])

  const fetchNewsletters = async () => {
    try {
      const response = await fetch('/api/newsletter/archive')
      if (response.ok) {
        const data = await response.json()
        setNewsletters(data)
      } else {
        setError('Failed to load newsletters')
      }
    } catch (error) {
      setError('An error occurred while loading newsletters')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="bg-white border border-gray-200 p-6 animate-pulse">
            <div className="h-4 bg-gray-200 w-3/4 mb-4"></div>
            <div className="h-3 bg-gray-200 w-1/2 mb-2"></div>
            <div className="space-y-2 mb-4">
              <div className="h-3 bg-gray-200"></div>
              <div className="h-3 bg-gray-200 w-5/6"></div>
            </div>
            <div className="h-8 bg-gray-200 w-24"></div>
          </div>
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 p-6 max-w-md mx-auto">
          <svg className="h-12 w-12 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h3 className="text-lg font-medium text-black mb-2">Error Loading Newsletters</h3>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    )
  }

  if (newsletters.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-gray-50 border border-gray-200 p-8 max-w-md mx-auto">
          <svg className="h-16 w-16 text-gray-400 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
          </svg>
          <h3 className="text-lg font-medium text-black mb-2">No Newsletters Yet</h3>
          <p className="text-gray-600">
            We haven't published any newsletters yet. Subscribe to be notified when we do!
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {newsletters.map((newsletter) => (
        <div key={newsletter.id} className="bg-white border border-gray-200 hover:border-black transition-colors duration-200">
          <div className="p-6">
            {/* Header */}
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-black mb-2 line-clamp-2">
                {newsletter.subject}
              </h3>
              <div className="flex items-center text-sm text-gray-500 mb-3">
                <CalendarIcon className="h-4 w-4 mr-1" />
                {formatDate(newsletter.sentAt)}
              </div>
            </div>

            {/* Preview Text */}
            {newsletter.previewText && (
              <p className="text-gray-600 text-sm mb-6 line-clamp-3">
                {newsletter.previewText}
              </p>
            )}

            {/* Action Button */}
            <Link
              href={`/newsletter/${newsletter.id}`}
              className="inline-flex items-center justify-center w-full px-4 py-2 border border-black text-sm font-medium text-black bg-white hover:bg-black hover:text-white focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 transition-colors"
            >
              Read Newsletter
              <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>
      ))}
    </div>
  )
}