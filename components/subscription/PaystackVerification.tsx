'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'

export default function PaystackVerification() {
  const [verifying, setVerifying] = useState(false)
  const [verified, setVerified] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const searchParams = useSearchParams()
  
  const success = searchParams.get('success')
  const reference = searchParams.get('reference') || searchParams.get('trxref')
  
  useEffect(() => {
    // Check for Paystack success callback with reference
    if (success === 'true' && reference && !verified && !verifying) {
      console.log('🔍 Paystack callback detected, verifying transaction:', reference)
      verifyTransaction(reference)
    }
  }, [success, reference, verified, verifying])
  
  const verifyTransaction = async (ref: string) => {
    setVerifying(true)
    setError(null)
    
    try {
      console.log('📞 Calling verification API for reference:', ref)
      const response = await fetch(`/api/paystack/verify?reference=${ref}`)
      const data = await response.json()
      
      console.log('📋 Verification response:', data)
      
      if (response.ok && data.success) {
        setVerified(true)
        console.log('✅ Payment verified successfully')
        // Refresh the page to show updated subscription status
        setTimeout(() => {
          window.location.href = '/account'
        }, 2000)
      } else {
        console.error('❌ Verification failed:', data)
        setError(data.error || 'Verification failed')
      }
    } catch (err) {
      console.error('❌ Network error during verification:', err)
      setError('Network error during verification')
    } finally {
      setVerifying(false)
    }
  }
  
  // Only show verification UI if we have success=true AND a reference (Paystack specific)
  if (!success || !reference) {
    return null
  }
  
  return (
    <div className="bg-blue-100 border-2 border-blue-400 p-4 mb-6">
      {verifying && (
        <div className="flex items-center gap-2">
          <svg className="animate-spin h-5 w-5 text-blue-600" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <p className="font-semibold text-blue-800">
            Verifying your payment with Paystack...
          </p>
        </div>
      )}
      
      {verified && (
        <div className="flex items-center gap-2">
          <svg className="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
          <p className="font-semibold text-green-800">
            Payment verified! Your subscription is now active. Redirecting...
          </p>
        </div>
      )}
      
      {error && (
        <div>
          <div className="flex items-center gap-2 mb-2">
            <svg className="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <p className="font-semibold text-red-800">
              Verification failed: {error}
            </p>
          </div>
          {reference && (
            <button 
              onClick={() => verifyTransaction(reference)}
              className="bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              Retry Verification
            </button>
          )}
        </div>
      )}
    </div>
  )
}