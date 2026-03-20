# Setup Guide - African News Platform

## Prerequisites

- Node.js 18+ installed
- pnpm installed (`npm install -g pnpm`)
- PostgreSQL database (Neon recommended)
- Stripe account
- Paystack account
- Resend account
- Vercel account (for deployment)

## Step 1: Install Dependencies

```bash
pnpm install
```

## Step 2: Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Fill in all required environment variables:

### Database (Neon)
1. Sign up at https://neon.tech
2. Create a new project
3. Copy the connection string (pooled) to `DATABASE_URL`
4. Copy the direct connection string to `DATABASE_URL_UNPOOLED`

### NextAuth
```bash
# Generate a secret
openssl rand -base64 32
```
Add to `NEXTAUTH_SECRET`

### Google OAuth
1. Go to Google Cloud Console
2. Create OAuth 2.0 credentials
3. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
4. Copy Client ID and Secret

### Apple Sign In
1. Go to Apple Developer Portal
2. Create Sign in with Apple service
3. Configure credentials

### Stripe
1. Sign up at https://stripe.com
2. Get API keys from Dashboard
3. Set up webhook endpoint: `/api/webhooks/stripe`
4. Copy webhook secret

### Paystack
1. Sign up at https://paystack.com
2. Get API keys from Settings
3. Set up webhook endpoint: `/api/webhooks/paystack`

### Resend
1. Sign up at https://resend.com
2. Get API key
3. Verify your domain

### Vercel Blob
1. Create Vercel project
2. Add Blob storage
3. Copy token

### ExchangeRate API
1. Sign up at https://www.exchangerate-api.com
2. Get free API key

## Step 3: Database Setup

Generate and run migrations:

```bash
pnpm db:generate
pnpm db:migrate
```

## Step 4: Run Development Server

```bash
pnpm dev
```

Open http://localhost:3000

## Step 5: Create Admin User

Access Payload CMS at http://localhost:3000/admin and create your first admin user.

## Step 6: Deploy to Vercel

```bash
vercel
```

Set all environment variables in Vercel dashboard.

## Database Indexes

After initial migration, ensure all indexes from the guide are applied for optimal performance.

## Cron Jobs

Configure Vercel Cron jobs:
- Trial reminders: Daily at 9 AM
- Sidebar refresh: Every 30 minutes

## Testing Payments

### Stripe Test Cards
- Success: 4242 4242 4242 4242
- Decline: 4000 0000 0000 0002

### Paystack Test Cards
- Success: 5060 6666 6666 6666 6666
- Decline: 5060 0000 0000 0000 0000

## Troubleshooting

### Database Connection Issues
- Verify DATABASE_URL is correct
- Check Neon project is active
- Ensure IP is whitelisted (if applicable)

### Auth Issues
- Verify NEXTAUTH_SECRET is set
- Check OAuth redirect URIs match
- Ensure NEXTAUTH_URL is correct

### Payment Issues
- Verify webhook endpoints are accessible
- Check webhook secrets match
- Test with test mode keys first

## Next Steps

1. Create sample articles in Payload CMS
2. Test subscription flow
3. Configure email templates
4. Set up monitoring and analytics
5. Configure CDN (Cloudflare)
