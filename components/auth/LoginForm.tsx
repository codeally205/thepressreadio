'use client'

import { useState } from 'react'
import { signInWithRedirect } from '@/lib/actions/auth-redirect'
import { useToast } from '@/components/ui/Toast'
import LoadingButton from '@/components/ui/LoadingButton'

export default function LoginForm() {
  const [isGoogleLoading, setIsGoogleLoading] = useState(false)
  const [isEmailLoading, setIsEmailLoading] = useState(false)
  const [email, setEmail] = useState('')
  const { success, error } = useToast()

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true)
    try {
      await signInWithRedirect('google')
    } catch (err) {
      console.error('Google sign in error:', err)
      error('Failed to sign in with Google')
      setIsGoogleLoading(false)
    }
  }

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email.trim()) {
      error('Please enter your email address')
      return
    }

    setIsEmailLoading(true)
    try {
      await signInWithRedirect('resend', email)
      success('Login link sent! Check your email.')
    } catch (err) {
      console.error('Email sign in error:', err)
      error('Failed to send login link')
      setIsEmailLoading(false)
    }
  }

  return (
    <div className="space-y-6 mb-8">
      {/* Google Sign In */}
      <LoadingButton
        onClick={handleGoogleSignIn}
        loading={isGoogleLoading}
        loadingText="Connecting..."
        variant="secondary"
        className="w-full py-3 flex items-center justify-center gap-3"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>
        Continue with Google
      </LoadingButton>

      {/* Email Form */}
      <form onSubmit={handleEmailSignIn} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-black mb-2">
            Email:
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            required
            disabled={isEmailLoading}
            className="w-full border-2 border-gray-300 px-3 py-2 text-black focus:border-black focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
          />
        </div>

        <div className="text-center pt-2">
          <LoadingButton
            type="submit"
            loading={isEmailLoading}
            loadingText="Sending..."
            variant="primary"
            className="px-6 py-2"
          >
            Send Login Link
          </LoadingButton>
        </div>
      </form>
    </div>
  )
}