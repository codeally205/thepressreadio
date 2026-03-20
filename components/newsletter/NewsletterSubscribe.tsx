'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useToast } from '@/components/ui/Toast'
import LoadingButton from '@/components/ui/LoadingButton'
import { EnvelopeIcon, CheckCircleIcon } from '@heroicons/react/24/outline'

export default function NewsletterSubscribe() {
  const { data: session } = useSession()
  const router = useRouter()
  const { success, error } = useToast()
  const [email, setEmail] = useState('')
  const [isSubscribing, setIsSubscribing] = useState(false)
  const [isRedirecting, setIsRedirecting] = useState(false)

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // Redirect to login if user is not authenticated
    if (!session?.user) {
      setIsRedirecting(true)
      router.push('/login')
      return
    }

    if (!email) {
      error('Please enter your email address')
      return
    }

    setIsSubscribing(true)

    try {
      const response = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        success('Successfully subscribed! Check your email for confirmation.')
        setEmail('')
      } else {
        error(data.error || 'Failed to subscribe. Please try again.')
      }
    } catch (err) {
      error('An error occurred. Please try again.')
    } finally {
      setIsSubscribing(false)
    }
  }

  // If user is already logged in, show different message
  if (session?.user) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <div className="border border-gray-200 p-8">
          <CheckCircleIcon className="h-12 w-12 text-black mx-auto mb-4" />
          <h3 className="text-xl font-bold text-black mb-2">
            You're subscribed
          </h3>
          <p className="text-gray-600 mb-4">
            As a registered user, you'll automatically receive our newsletter updates.
          </p>
          <p className="text-sm text-gray-500">
            Manage your subscription preferences in your account settings.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto">
      <div className="text-center mb-8">
        <h2 className="text-3xl font-bold text-black mb-4">
          Subscribe
        </h2>
        <p className="text-lg text-gray-600">
          Join thousands of readers who stay informed about African affairs.
        </p>
      </div>

      <div className="border border-gray-200 p-8">
        <form onSubmit={handleSubscribe}>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email address"
                className="w-full px-4 py-3 border border-gray-300 focus:ring-2 focus:ring-black focus:border-black"
                disabled={isSubscribing}
              />
            </div>
            <LoadingButton
              type="submit"
              loading={isSubscribing}
              loadingText="Subscribing..."
              variant="primary"
              className="px-8 py-3"
            >
              Subscribe
            </LoadingButton>
          </div>
        </form>

        {/* Simple Benefits */}
        <div className="grid grid-cols-3 gap-6 mt-8 pt-8 border-t border-gray-200 text-center">
          <div>
            <div className="font-medium text-black mb-1">Weekly</div>
            <div className="text-sm text-gray-500">Every Friday</div>
          </div>
          <div>
            <div className="font-medium text-black mb-1">Curated</div>
            <div className="text-sm text-gray-500">Quality content</div>
          </div>
          <div>
            <div className="font-medium text-black mb-1">Free</div>
            <div className="text-sm text-gray-500">No spam</div>
          </div>
        </div>
      </div>

      {/* Sign In Prompt for Non-Authenticated Users */}
      {!session?.user && (
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600 mb-4">
            Already have an account?
          </p>
          <LoadingButton
            onClick={() => {
              setIsRedirecting(true)
              router.push('/login')
            }}
            loading={isRedirecting}
            loadingText="Redirecting..."
            variant="secondary"
            size="sm"
          >
            Sign In
          </LoadingButton>
        </div>
      )}
    </div>
  )
}