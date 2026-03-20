# Payment Flow Analysis - Critical Issues Found

## Executive Summary

After analyzing your payment system, I've identified **7 CRITICAL ISSUES** that are preventing subscription status updates and causing free trial problems. These issues affect both Paystack and Stripe payment flows.

---

## 🚨 CRITICAL ISSUES

### 1. **PAYSTACK: Subscription Status Never Updates to 'active' After Payment**

**Location:** `app/api/webhooks/paystack/route.ts` (Line 145-180)

**Problem:** 
The `charge.success` webhook handler has a flawed logic flow:
- It tries to find subscription by `paystackCustomerCode` first
- If not found, it tries to find by `userId` and `paymentProcessor`
- **BUT**: When a user completes payment via `/api/paystack/verify`, the subscription is created WITHOUT a `paystackCustomerCode`
- The webhook receives `charge.success` but can't find the subscription because the customer code doesn't match
- Result: Subscription stays in 'trialing' status forever, never becomes 'active'

**Evidence:**
```typescript
// In verify route - subscription created WITHOUT customer code
const newSubscription = await db.insert(subscriptions).values({
  userId: session.user.id,
  plan: plan,
  status,  // 'trialing' or 'active'
  paystackCustomerCode: transactionData.customer?.customer_code, // Often NULL
  paymentProcessor: 'paystack',
})

// In webhook - tries to find by customer code that doesn't exist
subscription = await tx.query.subscriptions.findFirst({
  where: eq(subscriptions.paystackCustomerCode, charge.customer.customer_code),
})
```

**Impact:** Users pay but remain in trial status, never get activated.

---

### 2. **PAYSTACK: Duplicate Subscription Creation**

**Location:** `app/api/paystack/verify/route.ts` + `app/api/webhooks/paystack/route.ts`

**Problem:**
- User completes payment → `/api/paystack/verify` creates subscription
- Paystack sends `subscription.create` webhook → Creates ANOTHER subscription
- Result: User has 2 subscriptions in database, causing confusion

**Why it happens:**
- The verify endpoint creates subscription immediately after payment
- The webhook also creates subscription on `subscription.create` event
- No proper idempotency check between these two flows

---

### 3. **FREE TRIAL: No Automatic Expiration Handling**

**Location:** Missing functionality

**Problem:**
- Trials are created with `trialEndsAt` date
- Status is set to 'trialing'
- **BUT**: There's NO cron job or background process to automatically change status from 'trialing' to 'expired' when trial ends
- The cron job at `/api/cron/trial-reminders` only sends reminder emails, doesn't update status

**Impact:** 
- Users keep accessing premium content after trial expires
- System relies on client-side checks which can be bypassed
- No automatic conversion from trial to paid

---

### 4. **FREE TRIAL: Eligibility Check Race Condition**

**Location:** `lib/subscription-utils.ts` (Line 50-60)

**Problem:**
```typescript
export async function hasUserHadAnySubscription(userId: string): Promise<boolean> {
  try {
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });
    
    return !!existingSubscription;
  } catch (error) {
    console.error('Error checking user subscription history:', error);
    // Default to no trial if we can't check (safer for business)
    return true;  // ❌ WRONG: Returns TRUE on error, denying trial
  }
}
```

**Impact:** If database query fails, user is incorrectly marked as "has had trial" and denied free trial.

---

### 5. **STRIPE: Missing Subscription Status Updates**

**Location:** `app/api/webhooks/stripe/route.ts`

**Problem:**
The webhook uses `onConflictDoUpdate` but:
- Only updates on `stripeSubscriptionId` conflict
- Doesn't handle the case where subscription was created via trial flow (no stripeSubscriptionId yet)
- Missing handling for `customer.subscription.trial_will_end` event
- No automatic status change from 'trialing' to 'active' when trial ends and payment succeeds

**Code:**
```typescript
.onConflictDoUpdate({
  target: subscriptions.stripeSubscriptionId,  // ❌ Won't match trial subscriptions
  set: {
    status: subscription.status,
    // ...
  },
})
```

---

### 6. **PAYSTACK: Payment Verification Doesn't Update Existing Subscriptions**

**Location:** `app/api/paystack/verify/route.ts` (Line 70-85)

**Problem:**
```typescript
if (existingSubscription) {
  console.log('⚠️ User already has a Paystack subscription:', existingSubscription.id)
  
  // Just log the payment event without creating duplicate subscription
  await db.insert(paymentEvents).values({
    processor: 'paystack',
    eventType: 'charge.success',
    processorEventId: idempotencyKey,
    rawPayload: verification,
  })
  
  return NextResponse.json({ 
    success: true, 
    message: 'Payment verified, subscription already exists',
    subscription_id: existingSubscription.id
  })
}
```

**Impact:** 
- If user has a trial subscription and then pays, the payment is logged but subscription status is NOT updated
- User pays but stays in 'trialing' status

---

### 7. **TRIAL CREATION: No Payment Processor Validation**

**Location:** `app/api/subscription/create-trial/route.ts` (Line 50-52)

**Problem:**
```typescript
// Determine payment processor based on plan
const paymentProcessor = plan.startsWith('diaspora') ? 'stripe' : 'paystack'
```

**Issues:**
- Simple string check, no validation against actual plan configuration
- If plan name changes or is invalid, wrong processor is assigned
- No check if the processor credentials are configured
- Creates subscription with wrong processor, causing payment failures later

---

## 📊 PAYMENT FLOW BREAKDOWN

### Current Paystack Flow (BROKEN)

```
1. User clicks "Subscribe" → /api/checkout/paystack
2. Paystack checkout created → User redirected to Paystack
3. User completes payment
4. Paystack redirects to /account?success=true
5. Frontend calls /api/paystack/verify?reference=xxx
6. Verify endpoint:
   ✅ Creates subscription with status='trialing' or 'active'
   ❌ Often missing paystackCustomerCode
7. Paystack sends webhook: charge.success
8. Webhook handler:
   ❌ Can't find subscription (no matching customer code)
   ❌ Subscription never updated to 'active'
9. User stuck in 'trialing' status despite paying
```

### Current Stripe Flow (PARTIALLY BROKEN)

```
1. User clicks "Subscribe" → /api/checkout/stripe
2. Stripe checkout session created
3. User completes payment
4. Stripe sends webhook: customer.subscription.created
5. Webhook creates subscription with status='active' or 'trialing'
6. ✅ Works for direct payments
7. ❌ Doesn't work for trial-to-paid conversion
8. ❌ No handling for trial expiration
```

### Current Trial Flow (BROKEN)

```
1. User clicks "Start Free Trial"
2. /api/subscription/create-trial creates subscription:
   - status: 'trialing'
   - trialEndsAt: +14 days
   - No payment processor ID
3. User gets access to premium content
4. Trial expires (trialEndsAt passes)
5. ❌ Status never changes from 'trialing'
6. ❌ User keeps accessing content
7. ❌ No automatic conversion to paid
```

---

## 🔧 ROOT CAUSES

### 1. **Lack of Centralized Subscription State Management**
- Multiple endpoints create/update subscriptions independently
- No single source of truth for subscription status
- Verify endpoint and webhooks don't coordinate

### 2. **Missing Background Jobs**
- No cron job to expire trials
- No job to sync subscription status with payment processors
- No job to handle failed payments

### 3. **Incomplete Webhook Handling**
- Paystack: Missing proper subscription lifecycle events
- Stripe: Missing trial expiration events
- Both: No retry mechanism for failed webhook processing

### 4. **Poor Idempotency**
- Verify endpoint and webhooks can create duplicate subscriptions
- No distributed locking mechanism
- Race conditions between verify and webhook

### 5. **Inconsistent Data Model**
- Subscriptions can exist without processor IDs (trials)
- No way to link trial subscriptions to later payments
- Missing fields for tracking subscription lifecycle

---

## 💡 RECOMMENDED FIXES

### Priority 1: Fix Paystack Payment Status Updates

**File:** `app/api/webhooks/paystack/route.ts`

**Change the charge.success handler:**

```typescript
case 'charge.success': {
  const charge = event.data
  
  if (charge.plan && charge.customer.email) {
    const user = await tx.query.users.findFirst({
      where: eq(users.email, charge.customer.email),
    })

    if (!user) {
      console.warn('⚠️ User not found for payment:', charge.customer.email)
      break
    }

    // Find subscription by multiple criteria (more robust)
    let subscription = null
    
    // Try 1: Find by customer code
    if (charge.customer.customer_code) {
      subscription = await tx.query.subscriptions.findFirst({
        where: eq(subscriptions.paystackCustomerCode, charge.customer.customer_code),
      })
    }
    
    // Try 2: Find by user ID and payment processor (most recent)
    if (!subscription) {
      subscription = await tx.query.subscriptions.findFirst({
        where: and(
          eq(subscriptions.userId, user.id),
          eq(subscriptions.paymentProcessor, 'paystack'),
          // Only consider subscriptions that aren't already active
          sql`${subscriptions.status} IN ('trialing', 'pending')`
        ),
        orderBy: [desc(subscriptions.createdAt)],
      })
    }

    if (subscription) {
      // Update subscription to active and add customer code
      await tx
        .update(subscriptions)
        .set({
          status: 'active',
          paystackCustomerCode: charge.customer.customer_code || subscription.paystackCustomerCode,
          // Update period if we have next payment date
          currentPeriodEnd: charge.plan.next_payment_date 
            ? new Date(charge.plan.next_payment_date) 
            : subscription.currentPeriodEnd,
          updatedAt: new Date(),
        })
        .where(eq(subscriptions.id, subscription.id))

      console.log('✅ Subscription activated:', subscription.id)

      // Send payment receipt
      await sendPaymentReceiptEmail({
        email: charge.customer.email,
        name: user.name || undefined,
        plan: subscription.plan,
        amount: charge.amount / 100,
        currency: charge.currency,
        nextBillingDate: new Date(subscription.currentPeriodEnd),
      })
    } else {
      console.error('❌ No subscription found for payment:', {
        email: charge.customer.email,
        userId: user.id,
        customerCode: charge.customer.customer_code
      })
    }
  }
  break
}
```

### Priority 2: Fix Paystack Verify to Update Existing Subscriptions

**File:** `app/api/paystack/verify/route.ts`

**Replace the existing subscription check:**

```typescript
// Check if user already has a subscription
const existingSubscription = await db.query.subscriptions.findFirst({
  where: and(
    eq(subscriptions.userId, session.user.id),
    eq(subscriptions.paymentProcessor, 'paystack')
  ),
  orderBy: [desc(subscriptions.createdAt)],
})

if (existingSubscription) {
  console.log('📝 Updating existing subscription:', existingSubscription.id)
  
  // Update existing subscription to active
  const updatedSubscription = await db
    .update(subscriptions)
    .set({
      status: 'active',
      paystackCustomerCode: transactionData.customer?.customer_code || existingSubscription.paystackCustomerCode,
      currentPeriodEnd: calculatePeriodEndDate(plan),
      updatedAt: new Date(),
    })
    .where(eq(subscriptions.id, existingSubscription.id))
    .returning()
  
  // Log the payment event
  await db.insert(paymentEvents).values({
    processor: 'paystack',
    eventType: 'charge.success',
    processorEventId: idempotencyKey,
    rawPayload: verification,
  })
  
  return NextResponse.json({ 
    success: true, 
    message: 'Subscription activated successfully',
    subscription_id: updatedSubscription[0]?.id
  })
}
```

### Priority 3: Add Trial Expiration Cron Job

**Create new file:** `app/api/cron/expire-trials/route.ts`

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { subscriptions } from '@/lib/db/schema'
import { eq, and, lt } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  // Verify cron secret
  const authHeader = req.headers.get('authorization')
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const now = new Date()
    
    // Find all trialing subscriptions with expired trials
    const expiredTrials = await db
      .select()
      .from(subscriptions)
      .where(
        and(
          eq(subscriptions.status, 'trialing'),
          lt(subscriptions.trialEndsAt, now)
        )
      )

    let expiredCount = 0

    for (const subscription of expiredTrials) {
      // Update status to cancelled (trial expired without payment)
      await db
        .update(subscriptions)
        .set({
          status: 'cancelled',
          cancelledAt: now,
          updatedAt: now,
        })
        .where(eq(subscriptions.id, subscription.id))
      
      expiredCount++
      console.log(`✅ Expired trial for subscription: ${subscription.id}`)
    }

    return NextResponse.json({
      success: true,
      expiredCount,
      checkedCount: expiredTrials.length,
    })
  } catch (error) {
    console.error('Trial expiration cron error:', error)
    return NextResponse.json({ 
      error: 'Failed to expire trials' 
    }, { status: 500 })
  }
}
```

**Add to vercel.json:**

```json
{
  "crons": [
    {
      "path": "/api/cron/expire-trials",
      "schedule": "0 */6 * * *"
    },
    {
      "path": "/api/cron/trial-reminders",
      "schedule": "0 9 * * *"
    }
  ]
}
```

### Priority 4: Fix Trial Eligibility Error Handling

**File:** `lib/subscription-utils.ts`

```typescript
export async function hasUserHadAnySubscription(userId: string): Promise<boolean> {
  try {
    const existingSubscription = await db.query.subscriptions.findFirst({
      where: eq(subscriptions.userId, userId),
    });
    
    return !!existingSubscription;
  } catch (error) {
    console.error('Error checking user subscription history:', error);
    // Return false on error - give user benefit of doubt for trial
    // Log error for monitoring
    return false;
  }
}
```

### Priority 5: Add Subscription Linking for Trials

**File:** `lib/db/schema.ts`

**Add new field to subscriptions table:**

```typescript
export const subscriptions = pgTable('subscriptions', {
  // ... existing fields ...
  
  // Link trial subscriptions to paid subscriptions
  upgradedFromTrialId: uuid('upgraded_from_trial_id').references(() => subscriptions.id),
  
  // Track payment reference for verification
  paymentReference: text('payment_reference'),
  
  // ... rest of fields ...
})
```

---

## 🎯 TESTING CHECKLIST

After implementing fixes, test these scenarios:

### Paystack Flow
- [ ] New user subscribes → Status becomes 'active' after payment
- [ ] User starts trial → Status is 'trialing'
- [ ] User with trial pays → Status changes from 'trialing' to 'active'
- [ ] Trial expires → Status changes to 'cancelled'
- [ ] Webhook arrives before verify → No duplicate subscription
- [ ] Verify arrives before webhook → Webhook updates existing subscription

### Stripe Flow
- [ ] New user subscribes → Status becomes 'active'
- [ ] User starts trial → Status is 'trialing'
- [ ] Trial expires with payment → Status becomes 'active'
- [ ] Trial expires without payment → Status becomes 'cancelled'

### Trial Flow
- [ ] First-time user can start trial
- [ ] User who had trial cannot start another
- [ ] Trial expires after 14 days
- [ ] Expired trial blocks premium content access
- [ ] User can upgrade from trial to paid

---

## 📈 MONITORING RECOMMENDATIONS

Add these logs/metrics:

1. **Subscription Status Changes**
   - Log every status transition with reason
   - Track time in each status

2. **Payment Events**
   - Log all webhook events with processing result
   - Track verify endpoint calls

3. **Trial Metrics**
   - Trial start count
   - Trial expiration count
   - Trial-to-paid conversion rate

4. **Error Tracking**
   - Failed webhook processing
   - Failed payment verifications
   - Database errors in subscription queries

---

## 🚀 IMPLEMENTATION ORDER

1. **Day 1:** Fix Paystack webhook handler (Priority 1)
2. **Day 1:** Fix Paystack verify endpoint (Priority 2)
3. **Day 2:** Add trial expiration cron (Priority 3)
4. **Day 2:** Fix error handling (Priority 4)
5. **Day 3:** Add subscription linking (Priority 5)
6. **Day 4:** Test all scenarios
7. **Day 5:** Deploy and monitor

---

## 📝 ADDITIONAL NOTES

### Database Migration Needed

You'll need to add the new fields:

```sql
ALTER TABLE subscriptions 
ADD COLUMN upgraded_from_trial_id UUID REFERENCES subscriptions(id),
ADD COLUMN payment_reference TEXT;

CREATE INDEX idx_subscriptions_payment_reference ON subscriptions(payment_reference);
CREATE INDEX idx_subscriptions_trial_expiration ON subscriptions(trial_ends_at) WHERE status = 'trialing';
```

### Environment Variables to Verify

Make sure these are set:
- `PAYSTACK_SECRET_KEY`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `CRON_SECRET`
- `NEXTAUTH_URL`

---

## ⚠️ CRITICAL: DO THIS FIRST

Before implementing fixes, **backup your database** and test in a staging environment. These changes affect core payment logic and could impact existing subscriptions.

---

**Analysis completed:** 2024-03-20
**Severity:** CRITICAL
**Estimated fix time:** 3-5 days
**Business impact:** HIGH - Users paying but not getting access
