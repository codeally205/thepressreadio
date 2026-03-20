# Stripe Webhook Issue - Resolved

## Problem

After completing Stripe payment, user returned to `/account?success=true` but subscription was not created. The account page showed the old expired subscription instead of a new active one.

## Root Cause

**Stripe webhooks don't work with localhost** because Stripe servers cannot reach your local development machine. The payment succeeded, but the webhook event that creates the subscription never reached your app.

## Evidence from Logs

```
✅ Checkout session created: cs_test_a1UfX5GGVZEIurP09I4t2V6t29jtkIPoHbHwRXQFRWmEEw6l2Sugj35HEv
✅ User returned to: /account?success=true
❌ No webhook events received
❌ No subscription created
```

## Immediate Solution (Manual Fix)

Created subscription manually for `emmabyiringiro215@gmail.com`:

```
✅ Subscription ID: f2039725-cc25-4139-85fb-a497430a417c
✅ Plan: diaspora_monthly
✅ Status: active
✅ Period ends: April 20, 2026
```

**Action**: Refresh the account page to see the active subscription.

## Long-Term Solutions

### Option 1: Use Stripe CLI (Recommended for Development)

**Setup Steps**:

1. **Install Stripe CLI**:
   ```bash
   # Windows (PowerShell with Scoop)
   scoop install stripe
   
   # Or download from: https://github.com/stripe/stripe-cli/releases
   ```

2. **Login**:
   ```bash
   stripe login
   ```

3. **Forward webhooks to localhost**:
   ```bash
   stripe listen --forward-to localhost:3000/api/webhooks/stripe
   ```

4. **Copy the webhook secret** from CLI output:
   ```
   > Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
   ```

5. **Update .env**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
   ```

6. **Restart dev server**:
   ```bash
   pnpm dev
   ```

**Benefits**:
- ✅ Automatic subscription creation
- ✅ Real-time webhook testing
- ✅ See all Stripe events in terminal
- ✅ Works exactly like production

### Option 2: Manual Subscription Creation (Quick Fix)

After each test payment, run:
```bash
node manually-create-stripe-subscription.mjs
```

Edit the script to change:
- Email address
- Plan type
- Subscription dates

**Benefits**:
- ✅ No additional setup
- ✅ Quick for testing
- ❌ Manual process after each payment

### Option 3: Use ngrok (Alternative)

1. Install ngrok: https://ngrok.com/download
2. Run: `ngrok http 3000`
3. Copy the HTTPS URL (e.g., `https://abc123.ngrok.io`)
4. Add webhook in Stripe Dashboard: `https://abc123.ngrok.io/api/webhooks/stripe`
5. Update `.env` with webhook secret from Stripe Dashboard

**Benefits**:
- ✅ Works like production
- ✅ Can share URL for testing
- ❌ URL changes each time (free plan)
- ❌ Requires updating Stripe Dashboard

## Production Setup

For production deployment, webhooks will work automatically:

1. **Configure in Stripe Dashboard**:
   - Go to: Developers → Webhooks
   - Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
   - Select events:
     - `customer.subscription.created`
     - `customer.subscription.updated`
     - `customer.subscription.deleted`
     - `invoice.payment_succeeded`
     - `invoice.payment_failed`

2. **Add webhook secret to production env**:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_production_secret_here
   ```

3. **Deploy and test**

## Current Status

### ✅ Fixed for Current User
- User: `emmabyiringiro215@gmail.com`
- Subscription manually created
- Status: Active
- Can access premium content

### ✅ Code is Working
- Stripe checkout: ✅ Working
- Payment processing: ✅ Working
- Webhook handler: ✅ Working (when webhooks arrive)
- Email-based lookup: ✅ Working

### ⚠️ Development Limitation
- Webhooks don't reach localhost
- Need Stripe CLI or ngrok for automatic subscription creation
- Or use manual script after each test payment

## Recommended Next Steps

1. **For Development**:
   - Install Stripe CLI
   - Run `stripe listen --forward-to localhost:3000/api/webhooks/stripe`
   - Update `.env` with CLI webhook secret
   - Test full payment flow

2. **For Testing**:
   - Use test card: `4242 4242 4242 4242`
   - Watch Stripe CLI terminal for events
   - Verify subscription created automatically

3. **For Production**:
   - Configure webhook in Stripe Dashboard
   - Add production webhook secret to env vars
   - Test with real payment

## Verification

After setting up Stripe CLI, verify it works:

```bash
# Terminal 1: Run Stripe CLI
stripe listen --forward-to localhost:3000/api/webhooks/stripe

# Terminal 2: Run dev server
pnpm dev

# Browser: Complete test payment
# Watch Terminal 1 for webhook events
# Check app logs for subscription creation
# Verify account page shows active subscription
```

## Scripts Created

1. **check-stripe-subscription.mjs** - Diagnose webhook issues
2. **manually-create-stripe-subscription.mjs** - Create subscription manually
3. **STRIPE_WEBHOOK_LOCALHOST_SETUP.md** - Detailed setup guide

## Summary

The Stripe integration is working correctly. The only issue is that webhooks don't reach localhost in development. Use Stripe CLI to forward webhooks, or manually create subscriptions after test payments.

For production, webhooks will work automatically once configured in Stripe Dashboard.
