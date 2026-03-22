'use client'

import { useEffect, useRef } from 'react'

interface ArticleViewTrackerProps {
  slug: string
}

export default function ArticleViewTracker({ slug }: ArticleViewTrackerProps) {
  const tracked = useRef(false)

  useEffect(() => {
    // Only track once per page load
    if (tracked.current) return
    tracked.current = true

    // Track the view after a short delay to ensure the user is actually reading
    const timer = setTimeout(() => {
      fetch(`/api/articles/${slug}/view`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      }).catch(err => {
        console.warn('Failed to track article view:', err)
      })
    }, 2000) // 2 second delay to avoid counting accidental clicks

    return () => clearTimeout(timer)
  }, [slug])

  // This component doesn't render anything
  return null
}
