'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import SafeAdImage from '@/components/admin/SafeAdImage'

interface InlineAdsProps {
  showAds: boolean
  initialAds: any[]
  position?: 'top' | 'middle' | 'bottom'
}

export default function InlineAds({ showAds, initialAds, position = 'middle' }: InlineAdsProps) {
  const [currentAdIndex, setCurrentAdIndex] = useState(0)

  // Rotate ads every 15 seconds for inline ads (longer than sidebar)
  useEffect(() => {
    if (!showAds || initialAds.length <= 1) return

    const interval = setInterval(() => {
      setCurrentAdIndex((prevIndex) => 
        prevIndex === initialAds.length - 1 ? 0 : prevIndex + 1
      )
    }, 15000) // 15 seconds

    return () => clearInterval(interval)
  }, [showAds, initialAds.length])

  if (!showAds || initialAds.length === 0) {
    return null
  }

  const currentAd = initialAds[currentAdIndex]

  return (
    <div className="my-8 py-6 border-t border-b border-gray-200 bg-gradient-to-r from-gray-50 to-gray-100">
      <div className="text-center mb-4">
        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 bg-white px-3 py-1 rounded-full border">
          Advertisement
        </span>
      </div>
      
      <div className="max-w-2xl mx-auto">
        <div className="group relative overflow-hidden bg-white border-2 border-gray-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
          <div className="flex flex-col md:flex-row">
            {/* Image Section */}
            {currentAd.imageUrl && (
              <div className="md:w-1/2">
                <div className="aspect-[16/10] md:aspect-square relative overflow-hidden bg-gray-100">
                  <SafeAdImage
                    src={currentAd.imageUrl}
                    alt={currentAd.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 400px"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </div>
              </div>
            )}
            
            {/* Content Section */}
            <div className={`${currentAd.imageUrl ? 'md:w-1/2' : 'w-full'} p-6 flex flex-col justify-center`}>
              <div className="mb-2">
                <span className="inline-block bg-gradient-to-r from-blue-500 to-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full">
                  SPONSORED
                </span>
              </div>
              
              <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-blue-600 transition-colors duration-300">
                {currentAd.title}
              </h3>
              
              {currentAd.description && (
                <p className="text-gray-600 mb-4 line-clamp-3">
                  {currentAd.description}
                </p>
              )}
              
              {currentAd.linkUrl && (
                <Link
                  href={`/api/ads/${currentAd.id}/click?redirect=${encodeURIComponent(currentAd.linkUrl)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl"
                >
                  {currentAd.buttonText || 'Learn More'}
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </Link>
              )}
            </div>
          </div>
          
          {/* Subtle animation elements */}
          <div className="absolute top-4 right-4 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-75" />
          <div className="absolute bottom-4 left-4 w-1 h-1 bg-purple-400 rounded-full animate-pulse" />
        </div>
        
        {/* Ad indicators */}
        {initialAds.length > 1 && (
          <div className="flex justify-center space-x-2 mt-4">
            {initialAds.map((_, index) => (
              <button
                key={index}
                onClick={() => setCurrentAdIndex(index)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  index === currentAdIndex 
                    ? 'bg-blue-500 w-6' 
                    : 'bg-gray-300 hover:bg-blue-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
      
      <div className="text-center mt-4">
        <Link
          href="/advertise"
          className="text-xs text-gray-500 hover:text-gray-700 underline"
        >
          Advertise with us
        </Link>
      </div>
    </div>
  )
}