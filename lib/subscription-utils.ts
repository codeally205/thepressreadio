/**
 * Subscription utility functions for consistent trial period and subscription management
 */

import { db } from './db'
import { subscriptions } from './db/schema'
import { eq, and, gt, desc, sql } from 'drizzle-orm'

// Configuration constants
export const TRIAL_PERIOD_DAYS = 14;

/**
 * Check if user has had any previous subscription (for trial eligibility)
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user has had any subscription before
 */
export async function hasUserHadPreviousSubscription(userId: string): Promise<boolean> {
  return await hasUserHadAnySubscription(userId);
}

/**
 * Calculate trial end date based on user's subscription history
 * @param hasHadTrial - Whether the user has had a trial before
 * @returns Date object for trial end or null if no trial
 */
export function calculateTrialEndDate(hasHadTrial: boolean = false): Date | null {
  if (hasHadTrial) {
    return null; // No trial for existing customers
  }
  
  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + TRIAL_PERIOD_DAYS);
  return trialEndsAt;
}

/**
 * Determine subscription status based on trial eligibility
 * @param hasHadTrial - Whether the user has had a trial before
 * @returns 'trialing' or 'active'
 */
export function getInitialSubscriptionStatus(hasHadTrial: boolean = false): 'trialing' | 'active' {
  return hasHadTrial ? 'active' : 'trialing';
}

/**
 * Get trial information for a user (centralized trial logic)
 * @param userId - The user ID
 * @returns Promise with trial eligibility and dates
 */
export async function getUserTrialInfo(userId: string) {
  const hasHadTrial = await hasUserHadPreviousSubscription(userId);
  const trialEndsAt = calculateTrialEndDate(hasHadTrial);
  const status = getInitialSubscriptionStatus(hasHadTrial);
  
  return {
    hasHadTrial,
    trialEndsAt,
    status,
    isEligibleForTrial: !hasHadTrial
  };
}

/**
 * Calculate subscription period end date based on plan
 * @param plan - The subscription plan name
 * @param startDate - The start date (defaults to now)
 * @returns Date object for period end
 */
export function calculatePeriodEndDate(plan: string, startDate: Date = new Date()): Date {
  const periodEnd = new Date(startDate);
  
  if (plan.includes('yearly')) {
    periodEnd.setFullYear(periodEnd.getFullYear() + 1);
  } else {
    periodEnd.setMonth(periodEnd.getMonth() + 1);
  }
  
  return periodEnd;
}

/**
 * Create a unique idempotency key for payment events
 * @param event - The webhook event object
 * @returns Unique string for idempotency checking
 */
export function createPaymentIdempotencyKey(event: any): string {
  const eventId = event.data.id || event.data.subscription_code || Date.now();
  return `${event.event}-${event.data.reference}-${eventId}`;
}

/**
 * Validate subscription plan name
 * @param plan - The plan name to validate
 * @returns boolean indicating if plan is valid
 */
export function isValidPlan(plan: string): boolean {
  const validPlans = [
    'diaspora_monthly',
    'continent_monthly',
    'continent_yearly'
  ];
  
  return validPlans.includes(plan);
}

/**
 * Check if user has had any subscription (including cancelled ones) for trial eligibility
 * @param userId - The user ID to check
 * @returns Promise<boolean> - true if user has had any subscription before
 */
export async function hasUserHadAnySubscription(userId: string): Promise<boolean> {
  try {
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });
    
    return !!existingSubscription;
  } catch (error) {
    console.error('Error checking user subscription history:', error);
    // Return false on error - give user benefit of doubt for trial
    // This is more user-friendly and the error is logged for monitoring
    return false;
  }
}

/**
 * Get current active subscription for a user
 * @param userId - The user ID
 * @returns Promise with current subscription or null
 */
export async function getCurrentSubscription(userId: string) {
  try {
    const subscription = await db.query.subscriptions.findFirst({
      where: and(
        eq(subscriptions.userId, userId),
        // Include active, trialing, and cancelled (but not expired) subscriptions
        sql`(${subscriptions.status} IN ('active', 'trialing') OR 
             (${subscriptions.status} = 'cancelled' AND ${subscriptions.currentPeriodEnd} > NOW()))`
      ),
      orderBy: [sql`${subscriptions.createdAt} DESC`],
    });
    
    return subscription || null;
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return null;
  }
}

/**
 * Check if a trial has expired
 * @param trialEndsAt - The trial end date
 * @returns boolean indicating if trial has expired
 */
export function isTrialExpired(trialEndsAt: Date | null): boolean {
  if (!trialEndsAt) return false;
  return new Date() > trialEndsAt;
}

/**
 * Get subscription status with trial expiration check
 * @param subscription - The subscription object
 * @returns Updated status considering trial expiration
 */
export function getEffectiveSubscriptionStatus(subscription: any): string {
  if (!subscription) return 'inactive';
  
  if (subscription.status === 'trialing' && subscription.trialEndsAt) {
    if (isTrialExpired(subscription.trialEndsAt)) {
      return 'trial_expired';
    }
  }
  
  if (subscription.status === 'cancelled' && subscription.currentPeriodEnd) {
    if (new Date() > subscription.currentPeriodEnd) {
      return 'expired';
    }
  }
  
  return subscription.status;
}