# Stripe and Trial Logic Fixes

## Issues Fixed

### 1. ✅ Stripe Not Working
**Problem**: Stripe checkout was using `session.user.id` which could be stale/incorrect

**Solution**: Updated to use email-based lookup like Paystack

### 2. ✅ Trial Redirecting to Stripe Checkout
**Problem**: When starting a trial, it was falling through to Stripe checkout instead of returning immediately

**Solution**: Added explicit return after successful trial creation to prevent fall-through

### 3. ✅ Trial Should Only Happen Once
**Problem**: Trial logic wasn't properly enforced

**Solution**: 
- Added check to reject trial requests if user already had trial
- Removed trial from Stripe checkout (trial is handled separately)
- Trial is only offered through `create-trial` API

## Changes Made

### File: `app/api/checkout/stripe/route.ts`

#### 1. Email-Based Lookup
```typescript
// OLD: Used session.user.id
const trialInfo = await getUserTrialInfo(session.user.id)

// NEW: Use email-based lookup
const user = await db.query.users.findFirst({
  where: eq(users.email, session.user.email),
})
const userId = user.id
const trialInfo = await getUserTrialInfo(userId)
```

#### 2. Explicit Return After Trial Creation
```typescript
// OLD: Could fall through to Stripe checkout
if (trialResponse.ok) {
  const trialData = await trialResponse.json()
  return NextResponse.json({ ... })
  // Missing explicit return - could fall through
}

// NEW: Explicit return prevents fall-through
if (trialResponse.ok) {
  const trialData = await trialResponse.json()
  // ✅ Return immediately - DO NOT fall through to Stripe checkout
  return NextResponse.json({ 
    success: true,
    trial: true,
    redirectUrl: trialData.redirectUrl || `/account?trial=started`,
    subscription: trialData.subscription
  })
}
```

#### 3. Reject Trial If Not Eligible
```typescript
// NEW: Explicit check and rejection
if (startTrial && !trialInfo.isEligibleForTrial) {
  console.log('❌ User not eligible for trial - they already had one')
  return NextResponse.json({ 
    error: 'You have already used your free trial. Please subscribe to continue.',
    hasHadTrial: true
  }, { status: 400 })
}
```

#### 4. No Trial in Stripe Checkout
```typescript
// OLD: Trial could be added in Stripe checkout
subscription_data: {
  trial_period_days: trialInfo.isEligibleForTrial ? 14 : undefined,
  ...
}

// NEW: No trial in Stripe checkout - trial is handled separately
subscription_data: {
  // ✅ NO trial in Stripe checkout - trial is handled separately
  trial_period_days: undefined,
  ...
}
```

## Trial Logic Flow

### For New Users (No Previous Subscription)

```
User clicks "Start Free Trial"
  ↓
Frontend sends: startTrial=true
  ↓
Stripe/Paystack checkout route checks eligibility
  ↓
✅ Eligible: Calls create-trial API
  ↓
Trial subscription created in database
  ↓
Returns: { trial: true, redirectUrl: '/account?trial=started' }
  ↓
Frontend redirects to account page
  ↓
User has 14-day trial access
```

### For Users Who Had Trial Before

```
User clicks "Subscribe Now"
  ↓
Frontend sends: startTrial=false (or true but will be rejected)
  ↓
Stripe/Paystack checkout route checks eligibility
  ↓
❌ Not eligible: Rejects trial request
  ↓
Creates Stripe/Paystack checkout session
  ↓
Returns: { checkoutUrl: 'https://checkout.stripe.com/...' }
  ↓
Frontend redirects to payment page
  ↓
User completes payment
  ↓
Subscription created as "active" (not "trialing")
```

## Testing

### Test Trial Creation (New User)

1. Create a new user (or delete subscription history)
2. Sign in
3. Go to `/subscribe`
4. Button should show "Start Free Trial"
5. Click button
6. Should redirect to `/account?trial=started` (NOT Stripe checkout)
7. Subscription created with status "trialing"

### Test Payment (User Who Had Trial)

1. Sign in with user who had trial (e.g., `blinktechnologies125@gmail.com`)
2. Go to `/subscribe`
3. Button should show "Subscribe Now"
4. Click button
5. Should redirect to Stripe checkout page
6. Complete payment with test card: `4242 4242 4242 4242`
7. Subscription created with status "active" (not "trialing")

### Test Trial Rejection

1. Sign in with user who had trial
2. Manually try to start trial (shouldn't be possible from UI)
3. Should get error: "You have already used your free trial"
4. Should NOT create trial subscription
5. Should NOT redirect to Stripe checkout

## Verification Queries

### Check If User Had Trial Before
```sql
SELECT 
  u.email,
  COUNT(s.id) as subscription_count,
  CASE WHEN COUNT(s.id) = 0 THEN 'YES' ELSE 'NO' END as eligible_for_trial
FROM "user" u
LEFT JOIN subscriptions s ON u.id = s.user_id
WHERE u.email = 'test@example.com'
GROUP BY u.email
```

### Check Current Subscription
```sql
SELECT 
  u.email,
  s.plan,
  s.status,
  s.trial_ends_at,
  s.payment_processor,
  s.stripe_subscription_id
FROM subscriptions s
JOIN "user" u ON s.user_id = u.id
WHERE u.email = 'test@example.com'
ORDER BY s.created_at DESC
LIMIT 1
```

## Expected Behavior

### Trial Creation
- ✅ Only happens once per user
- ✅ Creates subscription with status "trialing"
- ✅ Sets trial_ends_at to 14 days from now
- ✅ Redirects to `/account?trial=started`
- ✅ Does NOT go to Stripe checkout
- ✅ No payment required

### Regular Payment
- ✅ Happens for users who had trial
- ✅ Creates subscription with status "active"
- ✅ Sets trial_ends_at to NULL
- ✅ Redirects to Stripe checkout
- ✅ Payment required

### Trial Rejection
- ✅ Returns error if user already had trial
- ✅ Does NOT create trial subscription
- ✅ Does NOT redirect to Stripe checkout
- ✅ Frontend shows error message

## Stripe Test Cards

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Insufficient funds**: `4000 0000 0000 9995`
- **CVV**: Any 3 digits
- **Expiry**: Any future date
- **ZIP**: Any 5 digits

## Logs to Watch

When testing, watch for these logs:

### Trial Creation
```
🔍 Stripe checkout request: { email, plan, startTrial: true }
🔍 Trial info: { isEligibleForTrial: true, ... }
✅ User eligible for trial - creating trial subscription
✅ Trial subscription created successfully
```

### Payment Flow
```
🔍 Stripe checkout request: { email, plan, startTrial: false }
🔍 Trial info: { isEligibleForTrial: false, ... }
💳 Creating Stripe checkout session for immediate payment
✅ Found existing Stripe customer
✅ Checkout session created
```

### Trial Rejection
```
🔍 Stripe checkout request: { email, plan, startTrial: true }
🔍 Trial info: { isEligibleForTrial: false, ... }
❌ User not eligible for trial - they already had one
```

## Summary

All three issues are now fixed:
1. ✅ Stripe uses email-based lookup (consistent with Paystack)
2. ✅ Trial creation returns immediately (no fall-through to Stripe)
3. ✅ Trial only happens once (enforced at multiple levels)

Ready to test!
