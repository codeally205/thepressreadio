'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { subscriptions } from '@/lib/db/schema'

interface SubscriptionManagementProps {
  subscription: typeof subscriptions.$inferSelect | null | undefined
}

export default function SubscriptionManagement({ subscription: initialSubscription }: SubscriptionManagementProps) {
  const [loading, setLoading] = useState(false)
  const [subscription, setSubscription] = useState(initialSubscription)
  const [refreshing, setRefreshing] = useState(false)
  const router = useRouter()

  // Refresh subscription data
  const refreshSubscription = async () => {
    setRefreshing(true)
    try {
      // Force a page refresh to get updated subscription data
      router.refresh()
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500))
    } catch (error) {
      console.error('Failed to refresh subscription:', error)
    } finally {
      setRefreshing(false)
    }
  }

  // Update local state when prop changes
  useEffect(() => {
    setSubscription(initialSubscription)
  }, [initialSubscription])

  const handleCancelSubscription = async () => {
    if (!confirm('Are you sure you want to cancel your subscription? You will lose access to premium content at the end of your current billing period.')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
      })

      const data = await response.json()

      if (response.ok) {
        // Show success message
        alert('Subscription cancelled successfully. You will have access until the end of your current billing period.')
        // Refresh the subscription data
        await refreshSubscription()
      } else {
        alert(data.error || 'Failed to cancel subscription. Please try again.')
      }
    } catch (error) {
      console.error('Cancel subscription error:', error)
      alert('Failed to cancel subscription. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleManageBilling = async () => {
    if (subscription?.paymentProcessor !== 'stripe') {
      alert('Billing management is only available for Stripe subscriptions.')
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/subscription/portal', {
        method: 'POST',
      })

      if (response.ok) {
        const { url } = await response.json()
        window.location.href = url
      } else {
        alert('Failed to open billing portal. Please try again.')
      }
    } catch (error) {
      console.error('Billing portal error:', error)
      alert('Failed to open billing portal. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  // Helper function to get effective status
  const getEffectiveStatus = () => {
    if (!subscription) return 'inactive'
    
    const now = new Date()
    
    // Check if trial has expired
    if (subscription.status === 'trialing' && subscription.trialEndsAt) {
      if (now > subscription.trialEndsAt) {
        return 'trial_expired'
      }
    }
    
    // Check if cancelled subscription has expired
    if (subscription.status === 'cancelled' && subscription.currentPeriodEnd) {
      if (now > subscription.currentPeriodEnd) {
        return 'expired'
      }
    }
    
    return subscription.status
  }

  const effectiveStatus = getEffectiveStatus()
  const canCancel = subscription && 
    (subscription.status === 'active' || subscription.status === 'trialing') && 
    !subscription.cancelAtPeriodEnd

  return (
    <div className="border-2 border-black p-6">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Subscription</h2>
        {subscription && (
          <button
            onClick={refreshSubscription}
            disabled={refreshing || loading}
            className="text-sm bg-gray-100 hover:bg-gray-200 px-3 py-1 border border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {refreshing ? (
              <span className="flex items-center gap-1">
                <svg className="animate-spin h-3 w-3" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Refreshing...
              </span>
            ) : (
              'Refresh'
            )}
          </button>
        )}
      </div>
      
      {subscription ? (
        <div className="space-y-4">
          <div>
            <span className="font-semibold">Plan:</span>{' '}
            <span className="capitalize">{subscription.plan.replace('_', ' ')}</span>
          </div>
          <div>
            <span className="font-semibold">Status:</span>{' '}
            <span className={`capitalize font-medium ${
              effectiveStatus === 'active' ? 'text-green-600' :
              effectiveStatus === 'trialing' ? 'text-blue-600' :
              effectiveStatus === 'cancelled' ? 'text-orange-600' :
              effectiveStatus === 'trial_expired' ? 'text-red-600' :
              effectiveStatus === 'expired' ? 'text-red-600' :
              'text-gray-600'
            }`}>
              {effectiveStatus === 'trial_expired' ? 'Trial Expired' :
               effectiveStatus === 'expired' ? 'Expired' :
               effectiveStatus}
            </span>
          </div>
          {/* Show different date information based on subscription status */}
          {subscription.status === 'trialing' && subscription.trialEndsAt ? (
            <div>
              <span className="font-semibold">Trial ends:</span>{' '}
              <span className={`font-medium ${
                effectiveStatus === 'trial_expired' ? 'text-red-600' : 'text-blue-600'
              }`}>
                {subscription.trialEndsAt.toLocaleDateString()}
                {effectiveStatus === 'trial_expired' && ' (Expired)'}
              </span>
            </div>
          ) : (
            <div>
              <span className="font-semibold">Current period ends:</span>{' '}
              {subscription.currentPeriodEnd.toLocaleDateString()}
            </div>
          )}
          
          {/* Status-specific messages */}
          {subscription.cancelAtPeriodEnd && subscription.status !== 'trialing' && (
            <div className="bg-yellow-100 border-2 border-yellow-400 p-4 mt-4">
              <p className="font-semibold text-yellow-800">
                Your subscription will be cancelled at the end of the current period ({subscription.currentPeriodEnd.toLocaleDateString()}).
              </p>
            </div>
          )}
          
          {subscription.status === 'cancelled' && (
            <div className="bg-red-100 border-2 border-red-400 p-4 mt-4">
              <p className="font-semibold text-red-800">
                Your subscription has been cancelled. You have access until {subscription.currentPeriodEnd.toLocaleDateString()}.
              </p>
            </div>
          )}

          {effectiveStatus === 'trial_expired' && (
            <div className="bg-red-100 border-2 border-red-400 p-4 mt-4">
              <p className="font-semibold text-red-800">
                Your free trial has expired. Please subscribe to continue accessing premium content.
              </p>
              <a
                href="/subscribe"
                className="inline-block mt-2 bg-red-600 text-white px-4 py-2 font-semibold hover:bg-red-700"
              >
                Subscribe Now
              </a>
            </div>
          )}

          {subscription.status === 'trialing' && effectiveStatus === 'trialing' && (
            <div className="bg-blue-100 border-2 border-blue-400 p-4 mt-4">
              <p className="font-semibold text-blue-800">
                You&apos;re currently on a free trial. Enjoy unlimited access to premium content until your trial expires.
              </p>
              <a
                href="/subscribe"
                className="inline-block mt-2 bg-blue-600 text-white px-4 py-2 font-semibold hover:bg-blue-700"
              >
                Subscribe to Continue After Trial
              </a>
            </div>
          )}

          {effectiveStatus === 'expired' && (
            <div className="bg-red-100 border-2 border-red-400 p-4 mt-4">
              <p className="font-semibold text-red-800">
                Your subscription has expired. Please renew to continue accessing premium content.
              </p>
              <a
                href="/subscribe"
                className="inline-block mt-2 bg-red-600 text-white px-4 py-2 font-semibold hover:bg-red-700"
              >
                Renew Subscription
              </a>
            </div>
          )}
          
          <div className="flex gap-3 pt-4">
            {subscription.paymentProcessor === 'stripe' && effectiveStatus !== 'expired' && effectiveStatus !== 'trial_expired' && (
              <button
                onClick={handleManageBilling}
                disabled={loading}
                className="bg-black text-white px-4 py-2 font-semibold hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Manage Billing'}
              </button>
            )}
            
            {canCancel && (
              <button
                onClick={handleCancelSubscription}
                disabled={loading}
                className="bg-red-600 text-white px-4 py-2 font-semibold hover:bg-red-700 disabled:opacity-50"
              >
                {loading ? 'Cancelling...' : 'Cancel Subscription'}
              </button>
            )}
          </div>

          <div className="text-sm text-gray-600 pt-2">
            <p>
              <strong>Payment processor:</strong> {subscription.paymentProcessor === 'stripe' ? 'Stripe' : 'Paystack'}
            </p>
            {subscription.paymentProcessor === 'paystack' && (
              <p className="mt-1">
                To manage your Paystack subscription, please contact our support team.
              </p>
            )}
          </div>
        </div>
      ) : (
        <div>
          <p className="mb-4">You don&apos;t have an active subscription.</p>
          <a
            href="/subscribe"
            className="inline-block bg-black text-white px-6 py-3 font-bold hover:bg-gray-800"
          >
            View Plans
          </a>
        </div>
      )}
    </div>
  )
}