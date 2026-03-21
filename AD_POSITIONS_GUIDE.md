# Ad Positions Implementation Guide

## Current Ad Positions in Database

The `ads` table has a `position` field with these values:
- **sidebar**: Right sidebar on article pages and homepage
- **inline**: Within article content or between article cards
- **banner**: Top banner or between sections

## Where Each Position Should Appear

### 1. SIDEBAR Ads
**Current Implementation:** ✅ Working
- Article page right sidebar (20% width)
- Homepage right sidebar (if implemented)
- Category pages right sidebar (if implemented)

**Files:**
- `app/(site)/article/[slug]/page.tsx` - Article sidebar
- `app/(site)/page.tsx` - Homepage sidebar
- `components/layout/Sidebar.tsx` - Global sidebar

### 2. INLINE Ads
**Current Implementation:** ❌ Not being used
**Should appear:**
- Between article cards on homepage (every 6 articles)
- Between article cards on category pages
- Within article content (after 3rd paragraph)
- Between newsletter items

**Need to implement in:**
- Homepage article grid
- Category pages
- Article body content
- Newsletter archive

### 3. BANNER Ads
**Current Implementation:** ❌ Not being used
**Should appear:**
- Top of homepage (below header)
- Top of category pages
- Top of article pages (above title)
- Between major sections

**Need to implement in:**
- All major pages

## Implementation Plan

### Step 1: Update Homepage to Show All Ad Types

File: `app/(site)/page.tsx`

```tsx
// Fetch different ad types
const sidebarAds = await getActiveAds('sidebar', 'unsubscribed', 10)
const inlineAds = await getActiveAds('inline', 'unsubscribed', 5)
const bannerAds = await getActiveAds('banner', 'unsubscribed', 1)

return (
  <div>
    {/* Banner Ad at top */}
    {showAds && bannerAds.length > 0 && (
      <div className="mb-8">
        <BannerAd ad={bannerAds[0]} />
      </div>
    )}

    <div className="grid grid-cols-12 gap-8">
      {/* Main content */}
      <div className="col-span-9">
        {articles.map((article, index) => (
          <>
            <ArticleCard article={article} />
            
            {/* Inline ad every 6 articles */}
            {showAds && index > 0 && (index + 1) % 6 === 0 && inlineAds[Math.floor(index / 6)] && (
              <InlineAd ad={inlineAds[Math.floor(index / 6)]} />
            )}
          </>
        ))}
      </div>

      {/* Sidebar with sidebar ads */}
      <div className="col-span-3">
        <ArticleSidebarAds ads={sidebarAds} />
      </div>
    </div>
  </div>
)
```

### Step 2: Create Banner Ad Component

File: `components/ads/BannerAd.tsx`

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'

interface BannerAdProps {
  ad: {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
    linkUrl: string | null
    buttonText: string | null
  }
}

export default function BannerAd({ ad }: BannerAdProps) {
  return (
    <div className="bg-gradient-to-r from-blue-50 to-purple-50 border border-gray-200 rounded-lg overflow-hidden">
      <div className="flex items-center justify-between p-4 md:p-6">
        {/* Left: Image */}
        {ad.imageUrl && (
          <div className="w-32 h-32 md:w-48 md:h-32 relative flex-shrink-0">
            <Image
              src={ad.imageUrl}
              alt={ad.title}
              fill
              className="object-cover rounded"
            />
          </div>
        )}

        {/* Center: Content */}
        <div className="flex-1 px-6">
          <div className="mb-2">
            <span className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded">
              SPONSORED
            </span>
          </div>
          <h3 className="text-xl md:text-2xl font-bold mb-2">{ad.title}</h3>
          {ad.description && (
            <p className="text-gray-600 text-sm md:text-base">{ad.description}</p>
          )}
        </div>

        {/* Right: CTA */}
        {ad.linkUrl && (
          <Link
            href={`/api/ads/${ad.id}/click?redirect=${encodeURIComponent(ad.linkUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors flex-shrink-0"
          >
            {ad.buttonText || 'Learn More'}
          </Link>
        )}
      </div>
    </div>
  )
}
```

### Step 3: Create Inline Ad Component (Compact)

File: `components/ads/InlineAdCard.tsx`

```tsx
'use client'

import Image from 'next/image'
import Link from 'next/link'

interface InlineAdCardProps {
  ad: {
    id: string
    title: string
    description: string | null
    imageUrl: string | null
    linkUrl: string | null
    buttonText: string | null
  }
}

export default function InlineAdCard({ ad }: InlineAdCardProps) {
  return (
    <div className="bg-white border-2 border-blue-200 rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow my-6">
      <div className="p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs font-bold bg-blue-500 text-white px-2 py-1 rounded">
            SPONSORED
          </span>
        </div>

        <div className="flex gap-4">
          {ad.imageUrl && (
            <div className="w-24 h-24 relative flex-shrink-0">
              <Image
                src={ad.imageUrl}
                alt={ad.title}
                fill
                className="object-cover rounded"
              />
            </div>
          )}

          <div className="flex-1">
            <h3 className="font-bold text-lg mb-2">{ad.title}</h3>
            {ad.description && (
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{ad.description}</p>
            )}
            {ad.linkUrl && (
              <Link
                href={`/api/ads/${ad.id}/click?redirect=${encodeURIComponent(ad.linkUrl)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2 rounded font-semibold hover:bg-blue-700 transition-colors text-sm"
              >
                {ad.buttonText || 'Learn More'}
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
```

### Step 4: Update Admin Dashboard to Show Position Info

The admin dashboard already has a position field. Make sure it's clear what each position means:

**Position Options:**
- **sidebar**: Shows in right sidebar (article pages, homepage)
- **inline**: Shows between content (article grids, within articles)
- **banner**: Shows as large banner (top of pages, between sections)

### Step 5: Seed Ads for Different Positions

Create ads with different positions to test:

```sql
-- Sidebar ads (already have 37)
-- Inline ads (need to create)
INSERT INTO ads (title, description, position, target_audience, status, priority)
VALUES 
  ('Inline Ad 1', 'This appears between articles', 'inline', 'unsubscribed', 'active', 100),
  ('Inline Ad 2', 'This appears between articles', 'inline', 'unsubscribed', 'active', 90);

-- Banner ads (need to create)
INSERT INTO ads (title, description, position, target_audience, status, priority)
VALUES 
  ('Banner Ad 1', 'This appears at top of pages', 'banner', 'unsubscribed', 'active', 100);
```

## Summary

**Current Status:**
- ✅ Sidebar ads working on article pages
- ❌ Inline ads not implemented
- ❌ Banner ads not implemented

**To Fix:**
1. Create BannerAd component
2. Create InlineAdCard component
3. Update homepage to fetch and show all 3 ad types
4. Update category pages to show all 3 ad types
5. Seed ads with different positions
6. Test each position displays correctly

**Admin Dashboard:**
The position field in admin already works - it saves to database correctly. The issue is that the frontend only queries for 'sidebar' position ads. Once you implement the above, all positions will work as expected.
