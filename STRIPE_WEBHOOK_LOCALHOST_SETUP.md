# Stripe Webhook Setup for Localhost

## Problem
Stripe webhooks don't work with `localhost` because Stripe can't reach your local machine.

## Solution: Use Stripe CLI

### 1. Install Stripe CLI

**Windows (PowerShell)**:
```powershell
# Using Scoop
scoop install stripe

# Or download from: https://github.com/stripe/stripe-cli/releases
```

**Mac**:
```bash
brew install stripe/stripe-cli/stripe
```

**Linux**:
```bash
# Download and install from: https://github.com/stripe/stripe-cli/releases
```

### 2. Login to Stripe CLI

```bash
stripe login
```

This will open your browser to authenticate.

### 3. Forward Webhooks to Localhost

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This command will:
- Start listening for Stripe events
- Forward them to your local server
- Give you a webhook signing secret

### 4. Update .env with New Webhook Secret

The CLI will output something like:
```
> Ready! Your webhook signing secret is whsec_xxxxxxxxxxxxx
```

Copy that secret and update your `.env`:
```
STRIPE_WEBHOOK_SECRET=whsec_xxxxxxxxxxxxx
```

### 5. Restart Your Dev Server

```bash
pnpm dev
```

### 6. Test Payment

Now when you complete a Stripe payment:
1. Stripe sends webhook to Stripe CLI
2. Stripe CLI forwards to your localhost
3. Your app processes the webhook
4. Subscription is created automatically

## Alternative: Manual Subscription Creation

If you don't want to use Stripe CLI, you can manually create subscriptions after payment:

```bash
node manually-create-stripe-subscription.mjs
```

This script will:
- Find the user who paid
- Create an active subscription
- Set proper dates

## Verification

After setting up Stripe CLI, test the flow:

1. Go to `/subscribe`
2. Click "Subscribe Now"
3. Complete payment with test card: `4242 4242 4242 4242`
4. Watch the Stripe CLI terminal - you should see events
5. Check your app logs - you should see webhook processing
6. Go to `/account` - subscription should be active

## Troubleshooting

### Webhook Secret Mismatch
If you see "Invalid signature" errors:
- Make sure you updated `.env` with the CLI webhook secret
- Restart your dev server after updating `.env`

### Events Not Forwarding
If Stripe CLI isn't forwarding events:
- Make sure your dev server is running on port 3000
- Check if another process is using port 3000
- Try restarting Stripe CLI

### Subscription Not Created
If payment succeeds but no subscription:
- Check Stripe CLI terminal for errors
- Check your app logs for webhook errors
- Verify webhook route is working: `curl http://localhost:3000/api/webhooks/stripe`

## Production Setup

For production, you'll configure webhooks in Stripe Dashboard:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy the webhook signing secret
5. Add to production environment variables
