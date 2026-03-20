# Email-Based User Lookup - Complete Implementation

## Problem Summary

The payment system had a critical foreign key constraint error:
```
Key (user_id)=(0411e341-ed5f-4543-8b0d-c6dcef2881a1) is not present in table "user"
```

Additionally, even when subscriptions were created successfully, the account page couldn't find them because of user ID mismatches between sessions and database records.

## Root Causes

1. **Session User ID Mismatch**: `session.user.id` from NextAuth JWT token didn't always match the actual user ID in the database
2. **OAuth Sign-in Race Conditions**: Google OAuth sign-ins could create sessions before user records were fully committed
3. **Stale Session Data**: User IDs in JWT tokens could become stale or incorrect
4. **No Active Sessions**: Users making payments might not have active sessions in the database

## Complete Solution

**Use email as the source of truth for all user lookups** - Email is:
- ✅ Guaranteed to be unique in the database
- ✅ Always present in Paystack transactions
- ✅ Stable across sessions and auth providers
- ✅ The actual identifier users care about

## Files Modified

### 1. Payment Verification Route
**File**: `app/api/paystack/verify/route.ts`

**Changes**:
```typescript
// OLD: Used session.user.id directly
const subscription = await db.query.subscriptions.findFirst({
  where: eq(subscriptions.userId, session.user.id),
})

// NEW: Look up user by email first
const paymentEmail = transactionData.customer?.email || session.user.email
const user = await db.query.users.findFirst({
  where: eq(users.email, paymentEmail),
})

if (!user) {
  return NextResponse.json({ 
    error: 'User account not found',
    email: paymentEmail
  }, { status: 404 })
}

const userId = user.id // Use verified user ID
const subscription = await db.query.subscriptions.findFirst({
  where: eq(subscriptions.userId, userId),
})
```

### 2. Checkout Route
**File**: `app/api/checkout/paystack/route.ts`

**Changes**:
```typescript
// Added email to metadata for verification
metadata: {
  plan: plan,
  user_id: session.user.id,
  user_email: session.user.email, // ✅ Added
  custom_fields: [
    {
      display_name: "User Email",
      variable_name: "user_email",
      value: session.user.email
    }
  ]
}
```

### 3. Account Page
**File**: `app/(site)/account/page.tsx`

**Changes**:
```typescript
// OLD: Used session.user.id directly
const subscription = await db.query.subscriptions.findFirst({
  where: eq(subscriptions.userId, session.user.id),
})

// NEW: Look up user by email first
const { users } = await import('@/lib/db/schema')
const user = await db.query.users.findFirst({
  where: eq(users.email, session.user.email),
})

if (!user) {
  redirect('/login?callbackUrl=/account')
}

const userId = user.id
const subscription = await db.query.subscriptions.findFirst({
  where: eq(subscriptions.userId, userId),
})
```

### 4. Subscribe Page
**File**: `app/(site)/subscribe/page.tsx`

**Changes**:
```typescript
// OLD: Used session.user.id directly
const userHasActiveSubscription = await hasActiveSubscription(session.user.id)

// NEW: Look up user by email first
const { users } = await import('@/lib/db/schema')
const user = await db.query.users.findFirst({
  where: (users, { eq }) => eq(users.email, session.user.email!),
})

const userId = user.id
const userHasActiveSubscription = await hasActiveSubscription(userId)
```

## Testing Results

### Test 1: Email-Based Verification
```bash
node test-email-based-verification.mjs
```

**Result**: ✅ All users can be found by email

### Test 2: Subscription Creation
```bash
# Made test payment with emmabyiringiro215@gmail.com
```

**Result**: 
```
✅ Subscription created: {
  subscriptionId: '51c5c993-0368-469e-990e-8db76d7d5417',
  plan: 'continent_monthly',
  status: 'trialing',
  trialEndsAt: 2026-04-03T12:58:57.307Z
}
```

### Test 3: Subscription Retrieval
```bash
node check-subscription-mismatch.mjs
```

**Result**: 
- ✅ Subscription correctly saved to database
- ✅ User ID matches between subscription and user table
- ✅ Account page query would find subscription
- ⚠️ No active session for test user (expected - different user was signed in)

## Benefits

1. **Eliminates Foreign Key Errors**: User ID is always valid because it's looked up from database
2. **Consistent User Identity**: Email is the single source of truth across all operations
3. **Better Error Messages**: Can tell users exactly which email has the issue
4. **Works with All Auth Providers**: Google, Email, Resend - all use email
5. **Session-Independent**: Works even if session user ID is stale or incorrect
6. **Future-Proof**: Email is stable, user IDs can change

## Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ User Signs In (Google/Email)                                │
│ Session: { email: "user@example.com", id: "session-id" }   │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ User Clicks Subscribe                                        │
│ Paystack Checkout: email = "user@example.com"              │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Payment Succeeds                                             │
│ Paystack Transaction: { customer: { email: "user@..." } }  │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Verify Route                                                 │
│ 1. Get email from transaction                               │
│ 2. Look up user: SELECT * FROM user WHERE email = ?        │
│ 3. Use found user.id to create subscription                │
│ ✅ Foreign key constraint satisfied                         │
└─────────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────────┐
│ Account Page                                                 │
│ 1. Get email from session                                   │
│ 2. Look up user: SELECT * FROM user WHERE email = ?        │
│ 3. Use found user.id to get subscription                   │
│ ✅ Subscription found and displayed                         │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Checklist

- [x] Update payment verification route
- [x] Update checkout route
- [x] Update account page
- [x] Update subscribe page
- [x] Test email-based lookup
- [x] Test subscription creation
- [x] Test subscription retrieval
- [ ] Deploy to production
- [ ] Test with real Google OAuth
- [ ] Test with real payment
- [ ] Monitor logs for errors

## Monitoring

After deployment, monitor for:
1. Any "User not found for email" errors
2. Foreign key constraint violations (should be zero)
3. Subscription creation success rate
4. Account page load times (email lookup adds one query)

## Rollback Plan

If critical issues occur:
1. Revert to using `session.user.id` directly
2. This will bring back the original foreign key error
3. Investigate why email lookup is failing
4. Fix and redeploy

## Next Steps

1. **Sign out and sign in** with the account that made the payment
2. **Refresh the account page** to see the subscription
3. **Test with a new user** to verify end-to-end flow
4. **Monitor production logs** for any email lookup failures
