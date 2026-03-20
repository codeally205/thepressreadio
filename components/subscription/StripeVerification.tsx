'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function StripeVerification() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error'>('verifying')
  const [message, setMessage] = useState('Verifying your payment...')

  useEffect(() => {
    if (!sessionId) return

    const verifyPayment = async () => {
      try {
        const response = await fetch(`/api/stripe/verify?session_id=${sessionId}`)
        const data = await response.json()

        if (response.ok) {
          setStatus('success')
          setMessage('Payment verified! Your subscription is now active.')
          
          // Redirect to clean URL after 2 seconds
          setTimeout(() => {
            router.push('/account')
            router.refresh()
          }, 2000)
        } else {
          setStatus('error')
          setMessage(data.error || 'Payment verification failed')
        }
      } catch (error) {
        setStatus('error')
        setMessage('Failed to verify payment. Please refresh the page.')
      }
    }

    verifyPayment()
  }, [sessionId, router])

  if (!sessionId) return null

  return (
    <div className={`border-2 p-4 mb-6 ${
      status === 'verifying' ? 'bg-blue-100 border-blue-400' :
      status === 'success' ? 'bg-green-100 border-green-400' :
      'bg-red-100 border-red-400'
    }`}>
      <div className="flex items-center gap-3">
        {status === 'verifying' && (
          <div className="animate-spin h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full" />
        )}
        {status === 'success' && (
          <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {status === 'error' && (
          <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        <p className={`font-semibold ${
          status === 'verifying' ? 'text-blue-800' :
          status === 'success' ? 'text-green-800' :
          'text-red-800'
        }`}>
          {message}
        </p>
      </div>
    </div>
  )
}
