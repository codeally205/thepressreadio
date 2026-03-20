# Push to GitHub Guide

## Repository
https://github.com/alliance74/thepressreadio

## Steps to Push

### 1. Add Remote Repository
```bash
git remote add origin https://github.com/alliance74/thepressreadio.git
```

### 2. Check Current Branch
```bash
git branch
```

### 3. Add All Files
```bash
git add .
```

### 4. Commit Changes
```bash
git commit -m "Complete payment system with email-based lookup

- Implemented email-based user lookup across all payment flows
- Fixed Stripe and Paystack integration
- Added trial logic (only once per user)
- Fixed subscription retrieval on account page
- Added comprehensive error handling
- Documented webhook setup for development and production"
```

### 5. Push to GitHub
```bash
# If pushing to main branch
git push -u origin main

# Or if pushing to master branch
git push -u origin master
```

## Important Notes

### ✅ Safe to Commit
These files are already in `.gitignore`:
- `.env` (contains secrets)
- `node_modules/` (dependencies)
- `.next/` (build files)

### 📝 What Will Be Committed
- All source code
- Configuration files (without secrets)
- Documentation files
- Test scripts
- Public assets

### 🔒 Secrets Protection
Your `.env` file contains:
- Database credentials
- API keys (Stripe, Paystack, Google, etc.)
- Webhook secrets

These are **NOT** committed because `.env` is in `.gitignore` ✅

### 📋 Commit Summary
This commit includes:
- Email-based lookup implementation
- Stripe checkout fixes
- Paystack integration
- Trial logic enforcement
- Subscription management
- Webhook handlers
- Account and subscribe pages
- Comprehensive documentation

## After Pushing

### Set Up Environment Variables on Deployment Platform

When deploying (Vercel, Netlify, etc.), add these environment variables:

```
DATABASE_URL=your_database_url
NEXTAUTH_SECRET=your_secret
NEXTAUTH_URL=your_production_url
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
STRIPE_SECRET_KEY=your_stripe_secret
STRIPE_PUBLISHABLE_KEY=your_stripe_public_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
PAYSTACK_SECRET_KEY=your_paystack_secret
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
RESEND_API_KEY=your_resend_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
```

### Configure Webhooks in Production

**Stripe**:
1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhooks/stripe`
3. Select events:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
4. Copy webhook secret and add to environment variables

**Paystack**:
1. Go to Paystack Dashboard → Settings → Webhooks
2. Add URL: `https://yourdomain.com/api/webhooks/paystack`
3. Copy webhook secret and add to environment variables

## Troubleshooting

### If Remote Already Exists
```bash
git remote remove origin
git remote add origin https://github.com/alliance74/thepressreadio.git
```

### If Branch Name is Different
```bash
# Check current branch
git branch

# Rename to main if needed
git branch -M main
```

### If Push is Rejected (Repository Not Empty)
```bash
# Pull first, then push
git pull origin main --allow-unrelated-histories
git push -u origin main
```

### If Authentication Required
You may need to:
1. Use GitHub Personal Access Token instead of password
2. Or use SSH key authentication
3. Or use GitHub CLI: `gh auth login`

## Verification

After pushing, verify on GitHub:
1. Go to https://github.com/alliance74/thepressreadio
2. Check that files are there
3. Verify `.env` is NOT visible (should be ignored)
4. Check commit message and files changed

## Next Steps

1. ✅ Push code to GitHub
2. ✅ Set up deployment (Vercel recommended)
3. ✅ Add environment variables to deployment platform
4. ✅ Configure production webhooks
5. ✅ Test payment flow in production
6. ✅ Monitor logs for any issues
