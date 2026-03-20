# Deployment Checklist

## Pre-Deployment

- [ ] All environment variables configured in Vercel
- [ ] Database migrations run successfully
- [ ] All indexes applied to database
- [ ] Stripe webhook endpoint configured
- [ ] Paystack webhook endpoint configured
- [ ] Domain DNS configured (if using custom domain)
- [ ] Email domain verified in Resend
- [ ] Test OAuth flows (Google, Apple)
- [ ] Test payment flows (Stripe, Paystack)

## Vercel Configuration

### Environment Variables
Set all variables from `.env.example` in Vercel dashboard:
- Database credentials
- Auth secrets and OAuth credentials
- Payment processor keys
- Email service keys
- API keys for external services

### Cron Jobs
Configure in Vercel dashboard or via `vercel.json`:
- `/api/cron/trial-reminders` - Daily at 9 AM
- `/api/cron/refresh-sidebar` - Every 30 minutes

### Build Settings
- Framework: Next.js
- Build Command: `pnpm build`
- Output Directory: `.next`
- Install Command: `pnpm install`

## Post-Deployment

- [ ] Verify homepage loads correctly
- [ ] Test article pages
- [ ] Test authentication flows
- [ ] Test subscription checkout
- [ ] Verify webhooks are receiving events
- [ ] Check sidebar data is loading
- [ ] Test email delivery
- [ ] Verify sitemap is accessible
- [ ] Run Lighthouse audit
- [ ] Test mobile responsiveness
- [ ] Verify all API routes work

## Monitoring

Set up monitoring for:
- Error tracking (Sentry recommended)
- Performance monitoring
- Database query performance
- Payment webhook failures
- Email delivery failures

## Security

- [ ] HTTPS enforced
- [ ] Security headers configured
- [ ] Rate limiting on auth routes
- [ ] Webhook signature verification
- [ ] CORS properly configured
- [ ] No secrets in client-side code

## Performance

- [ ] Images optimized
- [ ] ISR configured correctly
- [ ] Database queries use indexes
- [ ] Caching strategy implemented
- [ ] CDN configured (Cloudflare)

## SEO

- [ ] Sitemap accessible
- [ ] Robots.txt configured
- [ ] Meta tags on all pages
- [ ] OpenGraph images set
- [ ] Structured data (JSON-LD) added

## Backup

- [ ] Database backup strategy
- [ ] Regular backup schedule
- [ ] Backup restoration tested

## Documentation

- [ ] README updated
- [ ] API documentation
- [ ] Admin user guide
- [ ] Troubleshooting guide
