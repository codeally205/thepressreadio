'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

interface MainLoaderProps {
  isContentLoaded?: boolean
}

export default function MainLoader({ isContentLoaded = false }: MainLoaderProps) {
  const [isVisible, setIsVisible] = useState(true)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)

  useEffect(() => {
    // Ensure loader shows for at least 1.5 seconds for better UX
    const minTimer = setTimeout(() => {
      setMinTimeElapsed(true)
    }, 1500)

    return () => clearTimeout(minTimer)
  }, [])

  useEffect(() => {
    // Hide loader only when both conditions are met:
    // 1. Minimum time has elapsed
    // 2. Content is loaded
    if (minTimeElapsed && isContentLoaded) {
      const hideTimer = setTimeout(() => {
        setIsVisible(false)
      }, 300) // Small delay for smooth transition

      return () => clearTimeout(hideTimer)
    }
  }, [minTimeElapsed, isContentLoaded])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
      <div className="text-center">
        {/* Real Logo with animation */}
        <div className="relative w-32 h-32 mx-auto mb-8">
          {/* Spinning border animation */}
          <div className="absolute inset-0 rounded-full border-4 border-gray-200"></div>
          <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-black animate-spin"></div>
          
          {/* Logo container */}
          <div className="absolute inset-4 flex items-center justify-center bg-white rounded-full">
            <div className="relative w-16 h-16">
              <Image
                src="/logo.png"
                alt="ThePressRadio Logo"
                fill
                className="object-contain"
                priority
              />
            </div>
          </div>
        </div>
        
        {/* Loading text */}
        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-black">ThePressRadio</h2>
          <div className="flex items-center justify-center space-x-1">
            <span className="text-gray-600">Loading</span>
            <div className="flex space-x-1">
              <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
              <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
              <div className="w-1 h-1 bg-gray-600 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}