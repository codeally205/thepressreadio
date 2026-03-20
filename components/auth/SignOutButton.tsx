'use client'

import { useState } from 'react'
import { signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'

interface SignOutButtonProps {
  className?: string
  children: React.ReactNode
}

export default function SignOutButton({ className, children }: SignOutButtonProps) {
  const router = useRouter()
  const { info, error } = useToast()
  const [isSigningOut, setIsSigningOut] = useState(false)

  const handleSignOut = async () => {
    if (isSigningOut) return
    
    setIsSigningOut(true)
    info('Signing out...')
    
    try {
      // Set a flag to prevent auto-redirect back to admin
      sessionStorage.setItem('signing-out', 'true')
      
      // Use NextAuth's client-side signOut for better reliability
      await signOut({ 
        redirect: false,
        callbackUrl: '/' 
      })
      // Force navigation to home page
      router.push('/')
      router.refresh()
    } catch (err) {
      console.error('Sign out error:', err)
      error('Failed to sign out. Redirecting...')
      // Fallback: force redirect to home
      sessionStorage.setItem('signing-out', 'true')
      window.location.href = '/'
    }
    // Don't reset loading state as user will be redirected
  }

  return (
    <button
      onClick={handleSignOut}
      disabled={isSigningOut}
      className={`${className} ${isSigningOut ? 'opacity-50 cursor-not-allowed' : ''} flex items-center gap-2`}
    >
      {isSigningOut && (
        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
        </svg>
      )}
      {isSigningOut ? 'Signing Out...' : children}
    </button>
  )
}