'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState, useRef } from 'react'
import Image from 'next/image'

export default function AdminRedirectClient() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [isRedirecting, setIsRedirecting] = useState(false)
  const hasCheckedRedirect = useRef(false)

  useEffect(() => {
    // Only run redirect logic once per session
    if (status === 'loading' || hasCheckedRedirect.current) return

    // Only redirect if user is authenticated AND has admin/editor role
    if (status === 'authenticated' && session?.user && (session.user.role === 'admin' || session.user.role === 'editor')) {
      // Only redirect if we're on the homepage and not coming from a sign out
      if (window.location.pathname === '/' && !sessionStorage.getItem('signing-out')) {
        hasCheckedRedirect.current = true
        setIsRedirecting(true)
        // Small delay to show the redirect message
        setTimeout(() => {
          router.push('/admin')
        }, 1000)
      }
    }

    // Clear the signing out flag after a delay
    if (sessionStorage.getItem('signing-out')) {
      setTimeout(() => {
        sessionStorage.removeItem('signing-out')
      }, 2000)
    }

    // Mark as checked to prevent re-running
    if (status === 'authenticated' || status === 'unauthenticated') {
      hasCheckedRedirect.current = true
    }
  }, [session, status, router])

  // Show redirecting screen for admin users (only if authenticated)
  if (isRedirecting && status === 'authenticated') {
    return (
      <div className="fixed inset-0 bg-white z-50 flex items-center justify-center">
        <div className="text-center">
          <div className="relative w-16 h-16 mx-auto mb-6">
            <Image
              src="/logo.png"
              alt="ThePressRadio Logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-black mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-black mb-2">Redirecting to Admin Dashboard</h2>
          <p className="text-gray-600">Please wait...</p>
        </div>
      </div>
    )
  }

  return null
}