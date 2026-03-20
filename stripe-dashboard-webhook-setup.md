# Stripe Dashboard Webhook Setup

## For Production Deployment

### Step 1: Go to Stripe Dashboard
1. Visit [https://dashboard.stripe.com/webhooks](https://dashboard.stripe.com/webhooks)
2. Make sure you're in the correct account/mode (Test or Live)

### Step 2: Create New Endpoint
1. Click "Add endpoint"
2. Enter your endpoint URL:
   - For production: `https://yourdomain.com/api/webhooks/stripe`
   - For testing with ngrok: `https://your-ngrok-url.ngrok.io/api/webhooks/stripe`

### Step 3: Select Events
Select these specific events (required for your subscription system):

**Subscription Events:**
- `customer.subscription.created`
- `customer.subscription.updated`
- `customer.subscription.deleted`

**Invoice Events:**
- `invoice.payment_succeeded`
- `invoice.payment_failed`

### Step 4: Get Webhook Secret
1. After creating the endpoint, click on it
2. Click "Reveal" next to "Signing secret"
3. Copy the secret (starts with `whsec_`)
4. Add it to your environment variables:
   ```
   STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
   ```

### Step 5: Test the Webhook
1. In the Stripe Dashboard, go to your webhook endpoint
2. Click "Send test webhook"
3. Select `customer.subscription.created`
4. Click "Send test webhook"
5. Check your application logs to see if it received the event

## For Local Testing with ngrok

If you don't want to use Stripe CLI, you can use ngrok:

### Step 1: Install ngrok
```bash
# Download from https://ngrok.com/download
# Or using chocolatey:
choco install ngrok
```

### Step 2: Start your local server
```bash
npm run dev
```

### Step 3: Expose your local server
```bash
ngrok http 3000
```

### Step 4: Use the ngrok URL in Stripe Dashboard
Use the HTTPS URL from ngrok (e.g., `https://abc123.ngrok.io/api/webhooks/stripe`) when creating your webhook endpoint in the Stripe Dashboard.

## Verification

After setup, test a payment to ensure webhooks are working:
1. Make a test payment
2. Check your database for the subscription record
3. Check your application logs for webhook events
4. Verify the subscription status is updated correctly