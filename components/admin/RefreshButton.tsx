'use client'

import { useRouter } from 'next/navigation'
import { useState } from 'react'

interface RefreshButtonProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}

export default function RefreshButton({ className = '', size = 'md' }: RefreshButtonProps) {
  const router = useRouter()
  const [isRefreshing, setIsRefreshing] = useState(false)

  const handleRefresh = async () => {
    setIsRefreshing(true)
    try {
      router.refresh()
      // Small delay to show the loading state
      setTimeout(() => {
        setIsRefreshing(false)
      }, 500)
    } catch (error) {
      console.error('Refresh failed:', error)
      setIsRefreshing(false)
    }
  }

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-2 text-sm',
    lg: 'px-4 py-2 text-base'
  }

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5'
  }

  return (
    <button
      onClick={handleRefresh}
      disabled={isRefreshing}
      className={`
        inline-flex items-center gap-2 
        bg-white border border-gray-300 
        hover:bg-gray-50 hover:border-gray-400
        disabled:opacity-50 disabled:cursor-not-allowed
        transition-colors duration-200
        rounded-lg font-medium text-gray-700
        ${sizeClasses[size]}
        ${className}
      `}
    >
      <svg 
        className={`${iconSizes[size]} ${isRefreshing ? 'animate-spin' : ''}`}
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" 
        />
      </svg>
      {isRefreshing ? 'Refreshing...' : 'Refresh'}
    </button>
  )
}