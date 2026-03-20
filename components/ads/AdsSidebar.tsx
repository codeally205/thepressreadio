'use client'

import { useState, useEffect } from 'react'
import { db } from '@/lib/db'
import { ads } from '@/lib/db/schema'
import { and, eq, gte, lte, or, isNull } from 'drizzle-orm'
import Image from 'next/image'
import Link from 'next/link'
import SafeAdImage from '@/components/admin/SafeAdImage'

interface AdsSidebarProps {
  showAds: boolean // true for unsubscribed users, false for subscribers
  initialAds: any[] // Pass ads from server component
}

export default function AdsSidebar({ showAds, initialAds }: AdsSidebarProps) {
  const [currentStartIndex, setCurrentStartIndex] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [trackedImpressions, setTrackedImpressions] = useState<Set<string>>(new Set())
  const [isPaused, setIsPaused] = useState(false)

  // Track impressions for visible ads
  useEffect(() => {
    if (!showAds || initialAds.length === 0) return

    const currentAds = initialAds.slice(currentStartIndex, currentStartIndex + 2)
    if (currentAds.length === 1 && initialAds.length > 1) {
      currentAds.push(initialAds[0])
    }

    // Track impressions for currently visible ads
    currentAds.forEach(ad => {
      if (!trackedImpressions.has(ad.id)) {
        // Track impression
        fetch(`/api/ads/${ad.id}/impression`, { method: 'GET' })
          .catch(err => console.warn('Failed to track ad impression:', err))
        
        setTrackedImpressions(prev => new Set([...prev, ad.id]))
      }
    })
  }, [showAds, initialAds, currentStartIndex, trackedImpressions])

  // Auto-slide ads every 10 seconds if there are more than 2 ads
  useEffect(() => {
    if (!showAds || initialAds.length <= 2 || isPaused) return

    console.log('Setting up ad rotation for', initialAds.length, 'ads')

    const interval = setInterval(() => {
      console.log('Rotating ads from index', currentStartIndex)
      setIsTransitioning(true)
      
      setTimeout(() => {
        setCurrentStartIndex((prevIndex) => {
          // Move to next pair of ads, loop back to start when we reach the end
          const nextIndex = prevIndex + 2
          const newIndex = nextIndex >= initialAds.length ? 0 : nextIndex
          console.log('Moving from index', prevIndex, 'to', newIndex)
          return newIndex
        })
        setIsTransitioning(false)
      }, 300) // Transition duration
    }, 10000) // 10 seconds

    return () => {
      console.log('Cleaning up ad rotation interval')
      clearInterval(interval)
    }
  }, [showAds, initialAds.length, currentStartIndex, isPaused])

  if (!showAds || initialAds.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500 border border-gray-200 rounded-lg">
        <p className="text-sm">
          {!showAds ? 'Ads disabled for subscribed users' : 'No ads available'}
        </p>
        {!showAds && (
          <p className="text-xs mt-2">Thank you for subscribing!</p>
        )}
      </div>
    )
  }

  // Get current ads to display (always show at least 1, up to 2)
  const currentAds = initialAds.slice(currentStartIndex, currentStartIndex + 2)
  
  // If we only have one ad in the current slice and there are more ads available, 
  // add the first ad to make it two (for better visual balance)
  if (currentAds.length === 1 && initialAds.length > 1) {
    currentAds.push(initialAds[0])
  }

  const AdCard = ({ ad, index }: { ad: any, index: number }) => {
    // Validate ad data
    if (!ad || !ad.id || !ad.title) {
      console.warn('Invalid ad data:', ad)
      return null
    }

    return (
      <div className="group relative overflow-hidden bg-gradient-to-br from-purple-900/90 via-blue-900/90 to-indigo-900/90 backdrop-blur-sm border border-white/20 p-4 rounded-2xl shadow-2xl hover:shadow-purple-500/25 transition-all duration-500 transform hover:-translate-y-2 hover:scale-[1.02]">
        {/* Animated background orbs */}
        <div className="absolute -top-4 -right-4 w-16 h-16 bg-gradient-to-br from-pink-400 to-purple-600 rounded-full opacity-20 blur-xl animate-pulse" />
        <div className="absolute -bottom-4 -left-4 w-12 h-12 bg-gradient-to-br from-blue-400 to-cyan-600 rounded-full opacity-20 blur-lg animate-bounce delay-1000" />
        
        {/* Holographic border effect */}
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-pink-500/30 via-purple-500/30 to-cyan-500/30 opacity-0 group-hover:opacity-100 transition-opacity duration-500 animate-pulse" />
        
        {/* Cool "SPONSORED" badge */}
        <div className="absolute -top-2 -right-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white text-xs font-black px-3 py-1 rounded-full shadow-lg transform rotate-12 group-hover:rotate-0 transition-transform duration-300">
          <span className="relative z-10">SPONSORED</span>
          <div className="absolute inset-0 bg-gradient-to-r from-pink-600 via-purple-600 to-indigo-600 rounded-full blur-sm opacity-50" />
        </div>
        
        {ad.imageUrl && (
          <div className="aspect-[16/9] relative overflow-hidden bg-black/20 mb-3 rounded-xl border border-white/10 group-hover:border-white/30 transition-all duration-300">
            <SafeAdImage
              src={ad.imageUrl}
              alt={ad.title}
              fill
              className="object-cover group-hover:scale-110 transition-transform duration-700"
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 300px, 250px"
            />
            {/* Holographic overlay */}
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/20 via-transparent to-cyan-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            {/* Scan line effect - using CSS animation */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-white/10 to-transparent h-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 animate-pulse" />
          </div>
        )}
        
        <h4 className="font-black text-sm mb-2 line-clamp-2 text-white drop-shadow-lg group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-pink-400 group-hover:to-cyan-400 transition-all duration-300">
          {ad.title}
        </h4>
        
        {ad.description && (
          <p className="text-xs text-gray-200 mb-3 line-clamp-2 opacity-90">
            {ad.description}
          </p>
        )}
        
        {ad.linkUrl && (
          <Link
            href={`/api/ads/${ad.id}/click?redirect=${encodeURIComponent(ad.linkUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative inline-flex items-center gap-2 bg-gradient-to-r from-pink-500 via-purple-500 to-indigo-500 text-white px-4 py-2 text-xs font-bold hover:from-pink-400 hover:via-purple-400 hover:to-indigo-400 transition-all duration-300 rounded-full shadow-lg hover:shadow-pink-500/50 transform hover:scale-105 overflow-hidden group/btn"
          >
            <span className="relative z-10">{ad.buttonText || 'Learn More'}</span>
            <svg className="w-3 h-3 relative z-10 group-hover/btn:translate-x-1 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
            {/* Button shine effect */}
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -skew-x-12 -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700" />
          </Link>
        )}
        
        {/* Floating particles effect for first ad */}
        {index === 0 && (
          <>
            <div className="absolute top-4 left-4 w-1 h-1 bg-pink-400 rounded-full animate-ping" />
            <div className="absolute top-8 right-8 w-1 h-1 bg-cyan-400 rounded-full animate-ping delay-1000" />
            <div className="absolute bottom-6 left-6 w-1 h-1 bg-purple-400 rounded-full animate-ping delay-2000" />
          </>
        )}
      </div>
    )
  }

  return (
    <div 
      className="space-y-4"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative overflow-hidden">
        <div 
          className={`space-y-4 transition-all duration-300 ${
            isTransitioning ? 'opacity-0 transform translate-x-4' : 'opacity-100 transform translate-x-0'
          }`}
        >
          {currentAds.map((ad, index) => (
            <AdCard key={`${ad.id}-${currentStartIndex}-${index}`} ad={ad} index={index} />
          ))}
        </div>

        {/* Ad indicators - only show if there are more than 2 ads */}
        {initialAds.length > 2 && (
          <div className="flex justify-center space-x-2 mt-4">
            {Array.from({ length: Math.ceil(initialAds.length / 2) }).map((_, pairIndex) => (
              <button
                key={pairIndex}
                onClick={() => setCurrentStartIndex(pairIndex * 2)}
                className={`w-2 h-2 rounded-full transition-all duration-300 ${
                  Math.floor(currentStartIndex / 2) === pairIndex
                    ? 'bg-purple-500 w-6' 
                    : 'bg-gray-400 hover:bg-purple-300'
                }`}
                title={`Show ads ${pairIndex * 2 + 1}-${Math.min(pairIndex * 2 + 2, initialAds.length)}`}
              />
            ))}
          </div>
        )}
        
        {/* Slideshow info */}
        {initialAds.length > 2 && (
          <div className="text-center mt-2">
            <p className="text-xs text-gray-500">
              Showing {currentStartIndex + 1}-{Math.min(currentStartIndex + 2, initialAds.length)} of {initialAds.length} ads
            </p>
            <p className="text-xs text-gray-400 mt-1">
              {isPaused ? 'Paused - hover away to resume' : 'Auto-rotating every 10 seconds'}
            </p>
          </div>
        )}
      </div>
      
      <div className="text-center pt-2">
        <Link
          href="/advertise"
          className="inline-flex items-center gap-2 text-xs text-purple-600 hover:text-purple-800 font-bold transition-all duration-300 hover:scale-105 group"
        >
          <svg className="w-4 h-4 group-hover:rotate-12 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
          </svg>
          Advertise with us
        </Link>
      </div>
    </div>
  )
}