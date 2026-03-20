# African News Platform - Project Overview

## Architecture

This is a full-stack Pan-African digital news platform built as a monolithic Next.js 14 application with the following architecture:

### Frontend
- **Framework**: Next.js 14 with App Router
- **Styling**: Tailwind CSS (black & white theme)
- **UI Components**: Custom components following minimalist design
- **Rendering**: Server-side rendering with ISR for optimal performance

### Backend
- **API Routes**: Next.js API routes for all backend logic
- **Database**: PostgreSQL (Neon serverless)
- **ORM**: Drizzle ORM for type-safe database queries
- **Authentication**: NextAuth.js v5 with multiple providers
- **CMS**: Payload CMS co-deployed within Next.js

### External Services
- **Payments**: Stripe (diaspora) + Paystack (Africa)
- **Email**: Resend for transactional emails
- **Storage**: Vercel Blob for images
- **APIs**: ExchangeRate-API, World Bank API

## Key Features

### 1. Content Management
- Rich text editor (Payload Lexical)
- Article categorization (8 categories)
- Draft/scheduled/published workflow
- SEO metadata management
- Image upload and optimization

### 2. Paywall System
- Free articles accessible to all
- Premium articles with metering (3 free/month for non-subscribers)
- Soft paywall with preview (first 150 words)
- Ad-free experience for subscribers

### 3. Subscription Management
- Two pricing tiers (Diaspora $5/month, Continent $1/month)
- 14-day free trial (first subscription only)
- Region-based payment processor selection
- Subscription status caching for performance
- Webhook-based subscription updates

### 4. Authentication
- Email magic link (passwordless)
- Google OAuth
- Apple Sign In
- JWT-based sessions (30-day expiry)
- Role-based access control (admin/editor/viewer)

### 5. Sidebar Data
- Real-time FX rates (8 African currencies)
- Commodity prices (5 key commodities)
- 30-minute cache with fallback
- Desktop sidebar + mobile ticker

### 6. Newsletter System
- Visual template builder
- Subscriber management
- Open/click tracking
- Batch sending (500 per batch)

## Database Schema

### Core Tables
- **users**: User accounts and profiles
- **subscriptions**: Active and historical subscriptions
- **articles**: Published and draft content
- **tags**: Article categorization
- **newsletters**: Newsletter campaigns
- **payment_events**: Audit log for all payment events
- **article_views**: Metering for non-subscribers
- **sidebar_cache**: Server-side cache for external API data

### Performance Optimizations
- 20+ indexes covering all query patterns
- Partial indexes for filtered queries
- Connection pooling (max 10 connections)
- Three-layer caching strategy

## Caching Strategy

### Layer 1: Next.js ISR
- Homepage: 60s revalidation
- Category pages: 60s revalidation
- Article pages: 300s revalidation

### Layer 2: Server-side Cache
- Subscription status: 5min TTL per user
- Dashboard stats: 5min TTL global
- Category lists: 60s TTL per category

### Layer 3: Database Cache
- FX rates: 30min TTL
- Commodity prices: 30min TTL
- Automatic refresh via cron

## Security

### Authentication
- Secure JWT sessions
- OAuth 2.0 flows
- Magic link email verification

### Payments
- Webhook signature verification (Stripe + Paystack)
- Idempotency checks on all payment events
- PCI compliance via payment processors

### Application
- HTTPS enforced
- Security headers (CSP, X-Frame-Options, etc.)
- Rate limiting on auth routes
- CSRF protection via NextAuth
- No secrets in client code

## Performance

### Optimizations
- Image optimization via Next.js Image
- Code splitting and lazy loading
- Database query optimization with indexes
- Connection pooling
- Multi-layer caching
- CDN via Vercel Edge Network

### Monitoring
- Server-side error logging
- Database query performance tracking
- Payment webhook monitoring
- Email delivery tracking

## SEO

### Implementation
- Dynamic metadata generation
- OpenGraph and Twitter cards
- JSON-LD structured data (NewsArticle schema)
- XML sitemap (auto-generated)
- Robots.txt
- Canonical URLs

### Best Practices
- Semantic HTML
- Proper heading hierarchy
- Alt text on images
- Fast page load times
- Mobile-first responsive design

## Deployment

### Vercel Configuration
- Single deployment for entire stack
- Edge functions for API routes
- Automatic HTTPS
- Preview deployments for PRs
- Environment variable management

### Cron Jobs
- Trial reminders: Daily at 9 AM
- Sidebar refresh: Every 30 minutes

### Monitoring
- Build logs
- Runtime logs
- Error tracking
- Performance metrics

## Development Workflow

### Local Development
```bash
pnpm install
pnpm dev
```

### Database Migrations
```bash
pnpm db:generate
pnpm db:migrate
```

### Production Build
```bash
pnpm build
pnpm start
```

## File Structure

```
/app
  /(site)              # Public website
    /page.tsx          # Homepage
    /[category]        # Category pages
    /article/[slug]    # Article pages
    /subscribe         # Pricing page
    /account           # User account
  /(auth)              # Auth pages
  /(payload)           # CMS admin
  /api                 # API routes
/components            # React components
/lib                   # Utilities
  /db                  # Database client & schema
/emails                # Email templates
/types                 # TypeScript types
```

## Color Scheme

Following the requirement for black and white theme:
- Background: White (#ffffff)
- Foreground: Black (#000000)
- Borders: Black (#000000)
- Accents: Gray shades
- CTAs: Black background with white text
- Hover states: Gray (#e5e5e5)

## Future Enhancements

- Mobile app (React Native)
- Advanced analytics dashboard
- Author profiles and bylines
- Comment system
- Social sharing features
- Podcast integration
- Video content support
- Multi-language support
- Advanced search with filters
- Personalized recommendations
