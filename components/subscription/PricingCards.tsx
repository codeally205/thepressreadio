'use client'

import { useState, useEffect } from 'react'

interface PricingCardsProps {
  userRegion?: 'diaspora' | 'continent'
  userId?: string
  currentSubscription?: any
  detectedCountry?: string
}

export default function PricingCards({ userRegion = 'diaspora', userId, currentSubscription, detectedCountry }: PricingCardsProps) {
  const [loading, setLoading] = useState<string | null>(null)
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')
  const [detectedRegion, setDetectedRegion] = useState<'diaspora' | 'continent'>(userRegion)
  const [locationInfo, setLocationInfo] = useState<{
    country: string
    source: string
    loading: boolean
    error?: string
    city?: string
  }>({ country: detectedCountry || 'US', source: 'server', loading: true })
  const [trialEligibility, setTrialEligibility] = useState<{
    isEligible: boolean
    hasExpiredTrial: boolean
    loading: boolean
  }>({ isEligible: false, hasExpiredTrial: false, loading: true })

  // Detect location on client side for better accuracy
  useEffect(() => {
    const detectLocation = async () => {
      try {
        // Check for manual region override via URL parameter (for testing)
        const urlParams = new URLSearchParams(window.location.search)
        const manualRegion = urlParams.get('region') as 'diaspora' | 'continent' | null
        
        if (manualRegion === 'diaspora' || manualRegion === 'continent') {
          console.log('🔧 Manual region override:', manualRegion)
          setDetectedRegion(manualRegion)
          setLocationInfo({
            country: manualRegion === 'continent' ? 'GH' : 'US',
            source: 'manual-override',
            loading: false
          })
          return
        }

        const response = await fetch('/api/detect-location')
        if (response.ok) {
          const data = await response.json()
          console.log('🌍 Client-side location detection:', data)
          setDetectedRegion(data.region)
          setLocationInfo({
            country: data.country,
            source: data.source,
            loading: false,
            city: data.city
          })
        } else {
          const errorData = await response.json()
          console.error('❌ Location detection failed:', errorData)
          // Default to diaspora when location detection fails
          setDetectedRegion('diaspora')
          setLocationInfo({
            country: 'Unknown',
            source: 'error',
            loading: false,
            error: errorData.message || 'Failed to detect location'
          })
        }
      } catch (error) {
        console.error('Failed to detect location:', error)
        // Default to diaspora on network error
        setDetectedRegion('diaspora')
        setLocationInfo({
          country: 'Unknown',
          source: 'error',
          loading: false,
          error: 'Network error while detecting location'
        })
      }
    }

    detectLocation()
  }, [])

  // Check trial eligibility when component mounts
  useEffect(() => {
    const checkTrialEligibility = async () => {
      try {
        const response = await fetch('/api/subscription/trial-eligibility', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId })
        })
        
        if (response.ok) {
          const data = await response.json()
          setTrialEligibility({
            isEligible: data.isEligibleForTrial,
            hasExpiredTrial: data.hasHadTrial && !data.isEligibleForTrial,
            loading: false
          })
        }
      } catch (error) {
        console.error('Error checking trial eligibility:', error)
        setTrialEligibility({ isEligible: false, hasExpiredTrial: false, loading: false })
      }
    }

    if (userId) {
      checkTrialEligibility()
    } else {
      setTrialEligibility({ isEligible: true, hasExpiredTrial: false, loading: false })
    }
  }, [userId])

  const isTrialActive = (subscription: any) => {
    if (!subscription || subscription.status !== 'trialing' || !subscription.trialEndsAt) {
      return false
    }
    const isActive = new Date() <= new Date(subscription.trialEndsAt)
    console.log('🔍 Trial check:', {
      status: subscription.status,
      trialEndsAt: subscription.trialEndsAt,
      now: new Date().toISOString(),
      isActive
    })
    return isActive
  }

  const getButtonText = (plan: string) => {
    if (trialEligibility.loading) return 'Loading...'
    
    console.log('🔍 Button logic:', {
      plan,
      currentSubscription: currentSubscription ? {
        status: currentSubscription.status,
        trialEndsAt: currentSubscription.trialEndsAt
      } : null,
      trialEligibility,
      isTrialActive: currentSubscription ? isTrialActive(currentSubscription) : false
    })
    
    // If user has active subscription OR active trial, show manage subscription
    if (currentSubscription && (currentSubscription.status === 'active' || isTrialActive(currentSubscription))) {
      return 'Manage Subscription'
    }
    
    // If user is eligible for trial, show start free trial
    if (trialEligibility.isEligible) {
      return 'Start Free Trial'
    }
    
    // If user had trial before or trial expired, show subscribe now
    return 'Subscribe Now'
  }

  const getButtonAction = (plan: string) => {
    // If user has active subscription OR active trial, redirect to account
    if (currentSubscription && (currentSubscription.status === 'active' || isTrialActive(currentSubscription))) {
      return () => window.location.href = '/account'
    }
    
    // Otherwise handle subscription/trial
    return () => handleSubmit(plan)
  }

  const handleSubmit = async (plan: string) => {
    setLoading(plan)
    
    try {
      const formData = new FormData()
      formData.append('plan', plan)
      
      // Only set startTrial if user is eligible for trial
      if (trialEligibility.isEligible) {
        formData.append('startTrial', 'true')
      }
      
      // Choose the right endpoint based on plan
      const endpoint = plan.startsWith('diaspora') ? '/api/checkout/stripe' : '/api/checkout/paystack'
      
      const response = await fetch(endpoint, {
        method: 'POST',
        body: formData,
      })
      
      if (response.ok) {
        const data = await response.json()
        
        // If trial was created successfully, redirect to account page
        if (data.trial && data.redirectUrl) {
          console.log('✅ Trial created successfully, redirecting to account')
          window.location.href = data.redirectUrl
          return
        }
        
        // If checkout URL is provided, redirect to payment processor
        if (data.checkoutUrl) {
          console.log('Redirecting to payment checkout')
          window.location.href = data.checkoutUrl
          return
        }
        
        console.error('No redirect URL or checkout URL received')
        alert('Failed to start subscription. Please try again.')
      } else {
        const errorData = await response.json()
        console.error('Subscription failed:', response.status, errorData)
        
        if (errorData.hasHadTrial) {
          alert('You have already used your free trial. You can still subscribe to access premium content.')
        } else if (errorData.subscription) {
          alert('You already have an active subscription.')
          window.location.href = '/account'
        } else {
          alert('Failed to start subscription. Please try again.')
        }
      }
    } catch (error) {
      console.error('Subscription error:', error)
      alert('Failed to start subscription. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-4xl mx-auto">
      {/* Location Detection Error */}
      {locationInfo.error && (
        <div className="mb-6 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
          <div className="flex items-start gap-3">
            <svg className="w-6 h-6 text-red-600 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <div className="flex-1">
              <h3 className="font-bold text-red-900 mb-1">Location Detection Required</h3>
              <p className="text-red-800 text-sm mb-3">{locationInfo.error}</p>
              <div className="space-y-2 text-sm text-red-800">
                <p>To subscribe, we need to detect your location to show you the correct pricing:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li>Disable any VPN or proxy services</li>
                  <li>Ensure your browser allows location services</li>
                  <li>Check your internet connection</li>
                  <li>Try refreshing the page</li>
                </ul>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
              >
                Retry Location Detection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Location Detection Info */}
      {!locationInfo.loading && !locationInfo.error && (
        <div className="mb-6 text-center">
          <div className="inline-flex flex-col items-center gap-2">
            <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-200 px-4 py-2 rounded-lg text-sm">
              <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-blue-800">
                Showing {detectedRegion === 'continent' ? 'Africa' : 'International'} pricing
                {locationInfo.country !== 'Unknown' && ` (${locationInfo.country})`}
                {locationInfo.city && locationInfo.city !== 'Unknown' && locationInfo.city !== 'Development' && ` - ${locationInfo.city}`}
              </span>
            </div>
            {locationInfo.source && (
              <div className="text-xs text-gray-500">
                Detection: {locationInfo.source}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Billing Toggle - Show only for Africa users */}
      {detectedRegion === 'continent' && (
        <div className="flex justify-center mb-8">
          <div className="bg-gray-100 p-1 rounded-lg flex">
            <button
              onClick={() => setBillingCycle('monthly')}
              disabled={loading !== null}
              className={`px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
                billingCycle === 'monthly'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              disabled={loading !== null}
              className={`px-6 py-2 rounded-md font-medium transition-colors disabled:opacity-50 ${
                billingCycle === 'yearly'
                  ? 'bg-white text-black shadow-sm'
                  : 'text-gray-600 hover:text-black'
              }`}
            >
              Yearly
              <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                Save 17%
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Show only the relevant pricing card based on detected region */}
      <div className="max-w-md mx-auto">
        {detectedRegion === 'diaspora' ? (
          // Diaspora Plan Card
          <div className="border-4 border-black bg-black text-white p-8 relative">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Diaspora Plan</h2>
              <p className="text-gray-300">
                For readers outside Africa
              </p>
            </div>
            <div className="mb-6">
              <span className="text-5xl font-bold">$5</span>
              <span className="text-gray-300">/month</span>
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Unlimited premium articles</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Ad-free experience</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Weekly newsletter</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>14-day free trial</span>
              </li>
            </ul>
            <form onSubmit={(e) => { e.preventDefault(); getButtonAction('diaspora_monthly')(); }}>
              <button
                type="submit"
                disabled={loading !== null || trialEligibility.loading}
                className="w-full py-3 px-4 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-gray-200"
              >
                {loading === 'diaspora_monthly' ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    {trialEligibility.isEligible ? 'Starting Trial...' : 'Processing...'}
                  </span>
                ) : getButtonText('diaspora_monthly')}
              </button>
            </form>
          </div>
        ) : (
          // Continent Plan Card
          <div className="border-4 border-black bg-black text-white p-8 relative">
            <div className="mb-6">
              <h2 className="text-2xl font-bold mb-2">Continent Plan</h2>
              <p className="text-gray-300">
                For readers in Africa
              </p>
            </div>
            <div className="mb-6">
              <span className="text-5xl font-bold">
                {billingCycle === 'monthly' ? '₵16' : '₵160'}
              </span>
              <span className="text-gray-300">
                /{billingCycle === 'monthly' ? 'month' : 'year'}
              </span>
              {billingCycle === 'yearly' && (
                <div className="text-sm mt-2">
                  <span className="text-gray-300">
                    Only ₵13.33/month
                  </span>
                </div>
              )}
            </div>
            <ul className="space-y-3 mb-8">
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Unlimited premium articles</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Ad-free experience</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>Weekly newsletter</span>
              </li>
              <li className="flex items-start">
                <span className="mr-2">✓</span>
                <span>14-day free trial</span>
              </li>
              {billingCycle === 'yearly' && (
                <li className="flex items-start">
                  <span className="mr-2">✓</span>
                  <span>Mobile Money supported</span>
                </li>
              )}
            </ul>
            
            {billingCycle === 'monthly' ? (
              <div className="space-y-3">
                <div className="w-full py-3 px-4 font-bold text-center border-2 border-dashed border-gray-400 text-gray-400">
                  Mobile Money Not Available
                </div>
                <p className="text-xs text-center text-gray-300">
                  Mobile Money payment is only available for yearly plans. Switch to yearly to pay with Mobile Money.
                </p>
                <form action="/api/checkout/paystack" method="POST" onSubmit={(e) => { e.preventDefault(); getButtonAction('continent_monthly')(); }}>
                  <input type="hidden" name="plan" value="continent_monthly" />
                  <input type="hidden" name="startTrial" value={trialEligibility.isEligible ? "true" : "false"} />
                  <button
                    type="submit"
                    disabled={loading !== null || trialEligibility.loading}
                    className="w-full py-3 px-4 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-gray-200"
                  >
                    {loading === 'continent_monthly' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {trialEligibility.isEligible ? 'Starting Trial...' : 'Processing...'}
                      </span>
                    ) : getButtonText('continent_monthly')}
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-3">
                <form action="/api/checkout/paystack" method="POST" onSubmit={(e) => { e.preventDefault(); getButtonAction('continent_yearly')(); }}>
                  <input type="hidden" name="plan" value="continent_yearly" />
                  <input type="hidden" name="startTrial" value={trialEligibility.isEligible ? "true" : "false"} />
                  <button
                    type="submit"
                    disabled={loading !== null || trialEligibility.loading}
                    className="w-full py-3 px-4 font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-white text-black hover:bg-gray-200"
                  >
                    {loading === 'continent_yearly' ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        {trialEligibility.isEligible ? 'Starting Trial...' : 'Processing...'}
                      </span>
                    ) : getButtonText('continent_yearly')}
                  </button>
                </form>
                <p className="text-xs text-center text-gray-300">
                  14-day free trial, then Mobile Money and card payments available
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Loading overlay when processing */}
      {loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg text-center">
            <svg className="animate-spin h-8 w-8 mx-auto mb-4 text-black" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            <p className="text-lg font-semibold">Starting your free trial...</p>
            <p className="text-sm text-gray-600 mt-2">Please wait while we set up your account.</p>
          </div>
        </div>
      )}
    </div>
  )
}