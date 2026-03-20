# Trial Logic and Button Text Fix

## Issues Fixed

### 1. Button Text Not Updating
**Problem**: Buttons showed "Start Free Trial" even after trial expired or user already had a subscription.

**Root Cause**: Trial eligibility API was using `session.user.id` which could be stale or incorrect.

**Solution**: Updated trial eligibility API to use email-based lookup.

### 2. Trial Creation Shouldn't Use Stripe
**Problem**: Trial creation was mentioned to redirect to Stripe checkout.

**Solution**: Verified that `create-trial` API correctly creates trial directly and redirects to `/account?trial=started` (no Stripe redirect).

## Files Modified

### 1. Trial Eligibility API
**File**: `app/api/subscription/trial-eligibility/route.ts`

**Changes**:
```typescript
// OLD: Used session.user.id
const targetUserId = userId === session.user.id ? userId : session.user.id
const trialInfo = await getUserTrialInfo(targetUserId)

// NEW: Use email-based lookup
const user = await db.query.users.findFirst({
  where: eq(users.email, session.user.email),
})
const trialInfo = await getUserTrialInfo(user.id)
```

### 2. Create Trial API
**File**: `app/api/subscription/create-trial/route.ts`

**Changes**:
```typescript
// OLD: Used session.user.id
const trialInfo = await getUserTrialInfo(session.user.id)

// NEW: Use email-based lookup
const user = await db.query.users.findFirst({
  where: eq(users.email, session.user.email),
})
const trialInfo = await getUserTrialInfo(user.id)

// Also added explicit redirectUrl in response
return NextResponse.json({ 
  success: true,
  subscription: newSubscription[0],
  trialEndsAt: trialInfo.trialEndsAt,
  redirectUrl: '/account?trial=started' // ✅ No Stripe redirect
})
```

## Trial Logic Flow

### How Trial Eligibility Works

```typescript
// From lib/subscription-utils.ts
export async function getUserTrialInfo(userId: string) {
  // Check if user has ANY previous subscription
  const hasHadTrial = await hasUserHadPreviousSubscription(userId)
  
  // If they've had a subscription before, no trial
  const trialEndsAt = hasHadTrial ? null : calculateTrialEndDate()
  const status = hasHadTrial ? 'active' : 'trialing'
  
  return {
    hasHadTrial,
    trialEndsAt,
    status,
    isEligibleForTrial: !hasHadTrial // ✅ Key field
  }
}
```

### Button Text Logic

```typescript
// From components/subscription/PricingCards.tsx
const getButtonText = (plan: string) => {
  // 1. If user has active subscription, show "Manage Subscription"
  if (currentSubscription && currentSubscription.status === 'active') {
    return 'Manage Subscription'
  }
  
  // 2. If user is eligible for trial, show "Start Free Trial"
  if (trialEligibility.isEligible) {
    return 'Start Free Trial'
  }
  
  // 3. If user had trial before, show "Subscribe Now"
  return 'Subscribe Now'
}
```

## Test Users Setup

Two users are now configured for testing real payments:

### User 1: emmabyiringiro215@gmail.com
- Previous subscriptions: 1 (cancelled)
- Eligible for trial: ❌ NO
- Button shows: "Subscribe Now"
- Will go directly to payment (no trial)

### User 2: blinktechnologies125@gmail.com
- Previous subscriptions: 1 (cancelled)
- Eligible for trial: ❌ NO
- Button shows: "Subscribe Now"
- Will go directly to payment (no trial)

## Testing Steps

1. **Sign in** with one of the test emails
2. **Go to** `/subscribe` or `/pricing`
3. **Verify** button shows "Subscribe Now" (not "Start Free Trial")
4. **Click** subscribe button
5. **Verify** redirects to Paystack payment (not trial creation)
6. **Complete** payment with test card
7. **Verify** subscription is created as "active" (not "trialing")

## Expected Behavior

### For Users Who Had Trial Before
- ❌ No trial offered
- ✅ Payment required immediately
- ✅ Button shows "Subscribe Now"
- ✅ Subscription starts as "active"

### For New Users (No Previous Subscription)
- ✅ Trial offered
- ✅ Button shows "Start Free Trial"
- ✅ No payment required
- ✅ Subscription starts as "trialing"
- ✅ Redirects to `/account?trial=started`

## Database Changes

The setup script made these changes:

```sql
-- Cancelled active subscriptions
UPDATE subscriptions
SET 
  status = 'cancelled',
  cancelled_at = NOW(),
  updated_at = NOW()
WHERE user_id IN (...)

-- Set trial date to past (marks as "had trial before")
UPDATE subscriptions
SET 
  trial_ends_at = NOW() - INTERVAL '30 days',
  updated_at = NOW()
WHERE user_id IN (...)
```

## Verification Queries

### Check Trial Eligibility
```sql
SELECT 
  u.email,
  COUNT(s.id) as subscription_count,
  CASE WHEN COUNT(s.id) = 0 THEN 'YES' ELSE 'NO' END as eligible_for_trial
FROM "user" u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.email IN ('emmabyiringiro215@gmail.com', 'blinktechnologies125@gmail.com')
GROUP BY u.email
```

### Check Current Subscription Status
```sql
SELECT 
  u.email,
  s.plan,
  s.status,
  s.trial_ends_at,
  s.payment_processor
FROM subscriptions s
JOIN "user" u ON s.user_id = u.id
WHERE u.email IN ('emmabyiringiro215@gmail.com', 'blinktechnologies125@gmail.com')
ORDER BY s.created_at DESC
```

## Scripts Created

1. **check-and-end-trials.mjs** - Find and end trialing subscriptions
2. **end-specific-trials.mjs** - End trials for specific emails
3. **setup-test-users-for-payment.mjs** - Prepare users for payment testing

## Next Steps

1. ✅ Sign in with test user
2. ✅ Verify button shows "Subscribe Now"
3. ✅ Click subscribe and verify Paystack payment page loads
4. ✅ Complete test payment
5. ✅ Verify subscription is created as "active"
6. ✅ Verify account page shows active subscription

## Rollback

If issues occur, restore subscriptions:

```sql
UPDATE subscriptions
SET 
  status = 'active',
  cancelled_at = NULL,
  updated_at = NOW()
WHERE id IN ('51c5c993-0368-469e-990e-8db76d7d5417', '3e6964b9-6315-4103-97aa-c16d7d9c8f77')
```
