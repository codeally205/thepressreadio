# Paystack User ID Foreign Key Error - Fix Documentation

## Problem

Users were encountering this error when completing Paystack payments:

```
Key (user_id)=(0411e341-ed5f-4543-8b0d-c6dcef2881a1) is not present in table "user"
```

The subscriptions table has a foreign key constraint requiring the `user_id` to exist in the `user` table, but the payment verification route was trying to create a subscription for a user that doesn't exist in the database.

## Root Cause Analysis

### The Flow

1. **User signs in with Google OAuth**
   - NextAuth creates a session with JWT
   - DrizzleAdapter should create user record in database
   - Session token contains user ID

2. **User navigates to /subscribe**
   - Session is validated
   - User ID is read from session token
   - PricingCards component receives userId prop

3. **User clicks Subscribe button**
   - POST request to `/api/checkout/paystack`
   - Paystack transaction initialized with metadata containing `user_id`
   - User redirected to Paystack payment page

4. **User completes payment**
   - Paystack redirects to `/account?success=true`
   - Frontend calls `/api/paystack/verify?reference=xxx`
   - Verify route tries to create subscription with `user_id` from session

5. **ERROR: Foreign key constraint violation**
   - The `user_id` from the session doesn't exist in the database
   - Subscription insert fails

### Why This Happens

**Race Condition / Session Persistence Issue:**

1. User signs in with Google
2. Session is created immediately with a user ID
3. But the user record creation in the database:
   - Fails silently
   - Hasn't completed yet (async issue)
   - Was rolled back due to error
4. User proceeds to subscribe with a valid session but non-existent user record
5. Payment succeeds but subscription creation fails

**Possible Triggers:**
- Database connection issues during OAuth sign-in
- DrizzleAdapter errors not properly surfaced
- User deleted from database but session still valid
- Stale session from previous environment/database

## Diagnostic Results

Running `node debug-user-id-flow.mjs` revealed:

```
❌ User NOT FOUND in database
User ID: 0411e341-ed5f-4543-8b0d-c6dcef2881a1

No payment events found with this user ID
No subscriptions found for this user ID
No sessions found for this user ID
No OAuth accounts found for this user ID
```

This confirms the user record was never created or was deleted.

## Solution Implemented

### 1. Early User Verification in Verify Route

Added user existence check at the very beginning of the payment verification flow:

```typescript
// app/api/paystack/verify/route.ts

export async function GET(req: NextRequest) {
  const session = await auth()
  
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // ✅ CRITICAL: Verify user exists in database before processing payment
  console.log('🔍 Verifying user exists:', session.user.id, session.user.email)
  const userExists = await db.query.users.findFirst({
    where: eq(users.id, session.user.id),
  })
  
  if (!userExists) {
    console.error('❌ CRITICAL: User not found in database during payment verification')
    console.error('Session user ID:', session.user.id)
    console.error('Session email:', session.user.email)
    
    return NextResponse.json({ 
      error: 'User account not found. Please sign out and sign in again before subscribing.',
      details: 'Your session is valid but your user account was not found in the database.',
      userId: session.user.id,
      action: 'Please sign out and sign in again'
    }, { status: 404 })
  }
  
  console.log('✅ User verified:', {
    id: userExists.id,
    email: userExists.email,
    name: userExists.name,
    provider: userExists.authProvider
  })

  // Continue with payment verification...
}
```

### 2. Improved Error Messages

The error response now provides:
- Clear explanation of the problem
- Specific action to take (sign out and sign in again)
- Debugging information (user ID, email)
- User-friendly message for the frontend to display

### 3. Diagnostic Script

Created `debug-user-id-flow.mjs` to help diagnose user ID issues:

```bash
node debug-user-id-flow.mjs
```

This script checks:
- If the problematic user ID exists
- All recent users in the database
- Payment events for the user
- Subscriptions for the user
- Sessions for the user
- OAuth accounts for the user

## Testing the Fix

### Test Scenario 1: Normal Flow (Should Work)

1. Sign in with Google
2. Wait 2-3 seconds for user creation
3. Navigate to /subscribe
4. Complete payment
5. ✅ Subscription should be cr