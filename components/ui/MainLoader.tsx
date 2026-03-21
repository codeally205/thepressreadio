'use client'

import { useEffect, useState } from 'react'
import Image from 'next/image'

export default function MainLoader() {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    // Hide loader after DOM is interactive and minimum time has elapsed
    const minTime = 1000 // 1 second minimum
    const startTime = Date.now()

    const checkAndHide = () => {
      const elapsed = Date.now() - startTime
      const remainingTime = Math.max(0, minTime - elapsed)

      setTimeout(() => {
        setIsVisible(false)
      }, remainingTime)
    }

    // Check if DOM is already interactive or complete
    if (document.readyState === 'interactive' || document.readyState === 'complete') {
      checkAndHide()
    } else {
      // Wait for DOM to be interactive (not all resources loaded)
      const handleDOMReady = () => {
        checkAndHide()
      }
      document.addEventListener('DOMContentLoaded', handleDOMReady)
      return () => document.removeEventListener('DOMContentLoaded', handleDOMReady)
    }
  }, [])

  if (!isVisible) return null

  return (
    <div className="fixed inset-0 bg-white z-[9999] flex items-center justify-center">
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