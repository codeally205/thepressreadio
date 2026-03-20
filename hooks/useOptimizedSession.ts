'use client'

import { useSession } from 'next-auth/react'
import { useMemo } from 'react'

/**
 * Optimized session hook that reduces unnecessary re-renders
 * by memoizing session data and status checks
 */
export function useOptimizedSession() {
  const { data: session, status } = useSession()

  // Memoize commonly used session properties to prevent unnecessary re-renders
  const optimizedSession = useMemo(() => {
    return {
      session,
      status,
      isLoading: status === 'loading',
      isAuthenticated: status === 'authenticated',
      isUnauthenticated: status === 'unauthenticated',
      user: session?.user || null,
      isAdmin: session?.user?.role === 'admin',
      isEditor: session?.user?.role === 'editor',
      isAdminOrEditor: session?.user?.role === 'admin' || session?.user?.role === 'editor',
    }
  }, [session, status])

  return optimizedSession
}