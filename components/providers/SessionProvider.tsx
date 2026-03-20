'use client'

import { SessionProvider as NextAuthSessionProvider } from 'next-auth/react'

export default function SessionProvider({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <NextAuthSessionProvider
      // Reduce session polling frequency significantly
      refetchInterval={10 * 60} // Check every 10 minutes instead of default 60 seconds
      refetchOnWindowFocus={false} // Don't refetch when window gains focus
      refetchWhenOffline={false} // Don't refetch when offline
      // Use base path to ensure consistent session handling
      basePath="/api/auth"
    >
      {children}
    </NextAuthSessionProvider>
  )
}