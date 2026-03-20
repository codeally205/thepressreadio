# Stripe Webhook Setup Guide

## Current Status
✅ Webhook secret configured in `.env`
✅ Webhook handler implemented at `/api/webhooks/stripe`
✅ Test scripts created

## For Local Development

### 1. Using Generated Test Secret (Current Setup)
Your `.env` file now contains a test webhook secret:
```
STRIPE_WEBHOOK_SECRET=whsec_d05349bed26225990dff8af89f0861fc070fc7eae36db93a190df8efa19f642b
```

### 2. Test Your Webhook Locally
Run the test script to verify your webhook works:
```bash
node scripts/test-stripe-webhook.mjs
```

### 3. Install Stripe CLI (Optional but Recommended)
For more realistic testing, install Stripe CLI:

**Windows (Run as Administrator):**
```powershell
# Using Chocolatey
choco install stripe-cli

# Or download from: https://github.com/stripe/stripe-cli/releases
```

**After installing Stripe CLI:**
```bash
# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

This will give you a real webhook secret that starts with `whsec_`.

## For Production

### 1. Create Webhook Endpoint in Stripe Dashboard
1. Go to [Stripe Dashboard](https://dashboard.stripe.com/webhooks)
2. Click "Add endpoint"
3. Enter your production URL: `https://yourdomain.com/api/webhooks/stripe`
4. Select these events:
   - `customer.subscription.created`
   - `customer.subscription.updated` 
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`

### 2. Get the Webhook Secret
1. After creating the endpoint, click on it
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add it to your production environment variables

## Webhook Events Handled

Your webhook handler processes these events:
- `customer.subscription.created` - New subscription
- `customer.subscription.updated` - Subscription changes
- `customer.subscription.deleted` - Subscription cancelled

## Testing Webhook Locally

### Method 1: Using Test Script
```bash
node scripts/test-stripe-webhook.mjs
```

### Method 2: Using curl (from test script output)
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "Stripe-Signature: [signature from test script]" \
  -d '[payload from test script]' \
  http://localhost:3000/api/webhooks/stripe
```

### Method 3: Using Stripe CLI
```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

## Troubleshooting

### Common Issues:
1. **Invalid signature**: Check that `STRIPE_WEBHOOK_SECRET` matches your endpoint
2. **404 errors**: Ensure your dev server is running on port 3000
3. **Database errors**: Make sure your database is running and connected

### Debug Mode:
Add logging to your webhook handler to see incoming events:
```typescript
console.log('Received webhook:', event.type, event.id)
```

## Security Notes

- Never commit real webhook secrets to version control
- Use different secrets for development and production
- Validate webhook signatures to ensure requests come from Stripe
- Implement idempotency to handle duplicate events