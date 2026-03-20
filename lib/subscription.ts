import { db } from './db'
import { subscriptions } from './db/schema'
import { eq, and, gt, desc, sql } from 'drizzle-orm'
import { getCurrentSubscription, getEffectiveSubscriptionStatus } from './subscription-utils'

export async function getUserSubscription(userId: string) {
  return await getCurrentSubscription(userId)
}

export async function hasActiveSubscription(userId: string): Promise<boolean> {
  try {
    const subscription = await getCurrentSubscription(userId)
    if (!subscription) return false
    
    const effectiveStatus = getEffectiveSubscriptionStatus(subscription)
    
    // Consider active, trialing, and cancelled (but not expired) as having access
    return ['active', 'trialing', 'cancelled'].includes(effectiveStatus)
  } catch (error) {
    console.warn('Failed to check subscription status:', error)
    return false
  }
}

/**
 * Get detailed subscription info for content access control
 */
export async function getSubscriptionAccessInfo(userId: string) {
  try {
    const subscription = await getCurrentSubscription(userId)
    if (!subscription) {
      return {
        hasAccess: false,
        status: 'none',
        isTrialing: false,
        trialEndsAt: null,
        subscription: null
      }
    }
    
    const effectiveStatus = getEffectiveSubscriptionStatus(subscription)
    const hasAccess = ['active', 'trialing', 'cancelled'].includes(effectiveStatus)
    
    return {
      hasAccess,
      status: effectiveStatus,
      isTrialing: subscription.status === 'trialing',
      trialEndsAt: subscription.trialEndsAt,
      subscription
    }
  } catch (error) {
    console.warn('Failed to get subscription access info:', error)
    return {
      hasAccess: false,
      status: 'error',
      isTrialing: false,
      trialEndsAt: null,
      subscription: null
    }
  }
}