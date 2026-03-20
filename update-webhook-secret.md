# Update Webhook Secret

After running `stripe listen --forward-to localhost:3000/api/webhooks/stripe`, you'll get a webhook secret.

Copy the secret (starts with `whsec_`) and update your .env file:

```
STRIPE_WEBHOOK_SECRET=whsec_your_actual_secret_here
```

Then restart your development server:
```bash
npm run dev
```

The Stripe CLI will now forward all webhook events from your Stripe test account to your local server.