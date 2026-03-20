# Email-Based Payment Verification Fix

## Problem
Foreign key constraint error when creating subscriptions:
```
Key (user_id)=(0411e341-ed5f-4543-8b0d-c6dcef2881a1) is not present in table "user"
```

## Root Cause
The payment verification route was using `session.user.id` to create subscriptions, but this user ID didn't exist in the database. This happened because:

1. User signs in with Google OAuth
2. Session is created with a user ID
3. User immediately tries to subscribe
4. Race condition or session mismatch causes user ID to not match database
5. Subscription creation fails with foreign key constraint error

## Solution
**Use email instead of user ID for payment verification**

### Why Email is Better
1. ✅ Email is guaranteed to be in Paystack transaction (required field)
2. ✅ Email is unique in the database
3. ✅ No risk of session/user ID mismatch
4. ✅ More reliable for OAuth sign-ins
5. ✅ Works even if session user ID is stale

### Implementation

#### 1. Updated Paystack Verify Route (`app/api/paystack/verify/route.ts`)

**Before:**
```typescript
// Used session.user.id directly
const existingSubscription = await db.query.subscriptions.findFirst({
  where: eq(subscriptions.userId, session.user.id),
})
```

**After:**
```typescript
// Get email from Paystack transaction
const paymentEmail = transactionData.customer?.email || session.user.email

// Look up user by email
const user = await db.query.users.findFirst({
  where: eq(users.email, paymentEmail),
})

if (!user) {
  return NextResponse.json({ 
    error: 'User account not found',
    email: paymentEmail
  }, { status: 404 })
}

// Use the user ID from database lookup
const userId = user.id

// Create subscription with verified user ID
const existingSubscription = await db.query.subscriptions.findFirst({
  where: eq(subscriptions.userId, userId),
})
```

#### 2. Updated Paystack Checkout Route (`app/api/checkout/paystack/route.ts`)

Added email to metadata for better tracking:
```typescript
metadata: {
  plan: plan,
  user_id: session.user.id,
  user_email: session.user.email, // ✅ Added for verification
  custom_fields: [
    {
      display_name: "User Email",
      variable_name: "user_email",
      value: session.user.email
    }
  ]
}
```

## Flow Diagram

### Old Flow (Broken)
```
User signs in with Google
  ↓
Session created with user_id: ABC123
  ↓
User clicks Subscribe
  ↓
Paystack payment with email: user@example.com
  ↓
Payment succeeds
  ↓
Verify route uses session.user.id (ABC123)
  ↓
❌ User ABC123 not found in database
  ↓
Foreign key constraint error
```

### New Flow (Fixed)
```
User signs in with Google
  ↓
Session created with email: user@example.com
  ↓
User clicks Subscribe
  ↓
Paystack payment with email: user@example.com
  ↓
Payment succeeds
  ↓
Verify route gets email from transaction
  ↓
Look up user by email in database
  ↓
✅ User found with ID: XYZ789
  ↓
Create subscription with verified user ID
  ↓
✅ Success!
```

## Testing

Run the test script to verify the fix:
```bash
node test-email-based-verification.mjs
```

This will:
1. Test email-based user lookup
2. Verify existing users can be found by email
3. Confirm subscription creation is possible

## Benefits

1. **Eliminates foreign key errors** - User ID is always valid
2. **More reliable** - Email is the source of truth
3. **Better error messages** - Can tell user which email has the issue
4. **Works with OAuth** - No session/user ID mismatch issues
5. **Future-proof** - Email is stable, user IDs can change

## Files Modified

- `app/api/paystack/verify/route.ts` - Use email-based lookup
- `app/api/checkout/paystack/route.ts` - Add email to metadata
- `test-email-based-verification.mjs` - Test script
- `debug-user-id-flow.mjs` - Diagnostic script

## Next Steps

1. Test with a real Google OAuth sign-in
2. Make a test payment
3. Verify subscription is created successfully
4. Monitor logs for any email lookup failures

## Rollback Plan

If issues occur, the old behavior can be restored by reverting to using `session.user.id` directly, but this will bring back the original foreign key constraint error.
