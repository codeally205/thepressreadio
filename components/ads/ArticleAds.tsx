'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SafeAdImage from '@/components/admin/SafeAdImage'

interface ArticleAdsProps {
  showAds: boolean
  initialAds: any[]
}

export default function ArticleAds({ showAds, initialAds }: ArticleAdsProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0)

  // Rotate ads every 12 seconds
  useEffect(() => {
    if (!showAds || initialAds.length <= 1) return

    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => 
        prevIndex === initialAds.length - 1 ? 0 : prevIndex + 1
      )
    }, 12000) // 12 seconds

    return () => clearInterval(interval)
  }, [showAds, initialAds.length])

  if (!showAds || initialAds.length === 0) {
    return null
  }

  const currentAd = initialAds[currentAdIndex]

  return (
    <div className="my-6 p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-lg">
      <div className="text-center mb-3">
        <span className="text-xs font-semibold uppercase tracking-wider text-gray-500 bg-white px-2 py-1 rounded-full border">
          Sponsored Content
        </span>
      </div>
      
      <div className="flex items-center space-x-4">
        {/* Compact Image */}
        {currentAd.imageUrl && (
          <div className="w-20 h-20 relative overflow-hidden bg-gray-100 rounded-lg flex-shrink-0 border">
            <SafeAdImage
              src={currentAd.imageUrl}
              alt={currentAd.title}
              fill
              className="object-cover hover:scale-105 transition-transform duration-300"
              sizes="80px"
            />
          </div>
        )}
        
        {/* Content */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-sm text-gray-900 mb-1 line-clamp-2">
            {currentAd.title}
          </h4>
          
          {currentAd.description && (
            <p className="text-xs text-gray-600 mb-2 line-clamp-2">
              {currentAd.description}
            </p>
          )}
          
          {currentAd.linkUrl && (
            <Link
              href={`/api/ads/${currentAd.id}/click?redirect=${encodeURIComponent(currentAd.linkUrl)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 bg-blue-600 text-white px-3 py-1 text-xs font-medium hover:bg-blue-700 transition-colors rounded-full"
            >
              {currentAd.buttonText || 'Learn More'}
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
            </Link>
          )}
        </div>
      </div>
      
      {/* Ad indicators */}
      {initialAds.length > 1 && (
        <div className="flex justify-center space-x-1 mt-3">
          {initialAds.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentAdIndex(index)}
              className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                index === currentAdIndex 
                  ? 'bg-blue-500 w-4' 
                  : 'bg-gray-300 hover:bg-blue-300'
              }`}
            />
          ))}
        </div>
      )}
      
      <div className="text-center mt-2">
        <Link
          href="/advertise"
          className="text-xs text-gray-400 hover:text-gray-600 underline"
        >
          Advertise with us
        </Link>
      </div>
    </div>
  )
}