'use client'

import { useEffect, useState } from 'react'
import { useOptimizedSession } from '@/hooks/useOptimizedSession'
import { useLoading } from '@/components/providers/LoadingProvider'
import MainLoader from '@/components/ui/MainLoader'
import AdminRedirectClient from '@/components/auth/AdminRedirectClient'

interface HomePageClientProps {
  children: React.ReactNode
  articlesCount: number
}

export default function HomePageClient({ children, articlesCount }: HomePageClientProps) {
  const { isAuthenticated, isAdminOrEditor } = useOptimizedSession()
  const { setIsContentLoaded } = useLoading()
  const [showMainLoader, setShowMainLoader] = useState(true)
  const [isContentLoaded, setLocalContentLoaded] = useState(false)

  // Check if user is admin and should be redirected - memoize this check
  const shouldHideContent = isAuthenticated && isAdminOrEditor

  useEffect(() => {
    // Mark content as loaded when we have articles data from backend
    if (articlesCount > 0) {
      // Small delay to ensure DOM is rendered
      const timer = setTimeout(() => {
        setLocalContentLoaded(true)
        setIsContentLoaded(true)
      }, 100)

      return () => clearTimeout(timer)
    }
  }, [articlesCount, setIsContentLoaded])

  useEffect(() => {
    // Hide main loader when content is loaded
    if (isContentLoaded) {
      const timer = setTimeout(() => {
        setShowMainLoader(false)
      }, 300) // Small delay for smooth transition

      return () => clearTimeout(timer)
    }
  }, [isContentLoaded])

  return (
    <>
      <AdminRedirectClient />
      {!shouldHideContent && (
        <>
          {showMainLoader && <MainLoader />}
          {children}
        </>
      )}
    </>
  )
}