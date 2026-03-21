# Google Ads & Pagination Implementation Guide

## Part 1: Google AdSense Setup

### Step 1: Get Google AdSense Account
1. Go to https://www.google.com/adsense
2. Sign up with your Google account
3. Add your website URL
4. Wait for approval (usually 1-2 weeks)

### Step 2: Get Your AdSense ID
1. Once approved, go to AdSense dashboard
2. Navigate to Account → Account Information
3. Copy your Publisher ID (format: ca-pub-XXXXXXXXXXXXXXXX)

### Step 3: Add AdSense ID to Environment Variables
Add to `.env.local`:
```env
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=ca-pub-XXXXXXXXXXXXXXXX
```

Add to `.env.example`:
```env
NEXT_PUBLIC_GOOGLE_ADSENSE_ID=
```

### Step 4: Add AdSense Script to Root Layout
Update `app/layout.tsx` to include the AdSense script in the `<head>`:

```tsx
import Script from 'next/script'

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        {/* Google AdSense */}
        <Script
          async
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${process.env.NEXT_PUBLIC_GOOGLE_ADSENSE_ID}`}
          crossOrigin="anonymous"
          strategy="afterInteractive"
        />
      </head>
      <body>
        {children}
      </body>
    </html>
  )
}
```

### Step 5: Create Ad Units in AdSense
1. Go to Ads → By ad unit
2. Click "New ad unit"
3. Choose "Display ads"
4. Name it (e.g., "Article Sidebar", "Homepage Banner")
5. Copy the Ad Slot ID (format: XXXXXXXXXX)

### Step 6: Use GoogleAd Component
```tsx
import GoogleAd from '@/components/ads/GoogleAd'

// In your component
<GoogleAd 
  adSlot="XXXXXXXXXX" 
  adFormat="auto"
  className="my-4"
/>
```

## Part 2: Pagination Implementation

### Where to Add Pagination

#### 1. Homepage (Latest Articles)
File: `app/(site)/page.tsx`

```tsx
import Pagination from '@/components/ui/Pagination'

export default async function HomePage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Number(searchParams.page) || 1
  const perPage = 12
  const offset = (page - 1) * perPage

  // Fetch articles with pagination
  const articles = await db.query.articles.findMany({
    where: eq(articles.status, 'published'),
    limit: perPage,
    offset: offset,
    orderBy: [desc(articles.publishedAt)],
  })

  // Get total count
  const totalCount = await db.select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(eq(articles.status, 'published'))
  
  const totalPages = Math.ceil(Number(totalCount[0].count) / perPage)

  return (
    <div>
      {/* Articles grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      {/* Pagination */}
      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}
```

#### 2. Category Pages
File: `app/(site)/[category]/page.tsx`

```tsx
import Pagination from '@/components/ui/Pagination'

export default async function CategoryPage({ 
  params, 
  searchParams 
}: { 
  params: { category: string }
  searchParams: { page?: string }
}) {
  const page = Number(searchParams.page) || 1
  const perPage = 12
  const offset = (page - 1) * perPage

  const articles = await db.query.articles.findMany({
    where: and(
      eq(articles.status, 'published'),
      eq(articles.category, params.category)
    ),
    limit: perPage,
    offset: offset,
    orderBy: [desc(articles.publishedAt)],
  })

  const totalCount = await db.select({ count: sql<number>`count(*)` })
    .from(articles)
    .where(and(
      eq(articles.status, 'published'),
      eq(articles.category, params.category)
    ))
  
  const totalPages = Math.ceil(Number(totalCount[0].count) / perPage)

  return (
    <div>
      <h1>{params.category}</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {articles.map(article => (
          <ArticleCard key={article.id} article={article} />
        ))}
      </div>

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}
```

#### 3. Latest Articles Page
File: `app/(site)/latest/page.tsx`

Same pattern as homepage - add pagination with perPage limit.

#### 4. Newsletter Archive
File: `app/(site)/newsletter/page.tsx`

Same pattern - paginate newsletters.

### Admin Side Pagination

#### 1. Admin Articles List
File: `app/(payload)/admin/articles/page.tsx`

```tsx
import Pagination from '@/components/ui/Pagination'

export default async function AdminArticlesPage({ searchParams }: { searchParams: { page?: string } }) {
  const page = Number(searchParams.page) || 1
  const perPage = 20
  const offset = (page - 1) * perPage

  const articles = await db.query.articles.findMany({
    limit: perPage,
    offset: offset,
    orderBy: [desc(articles.createdAt)],
  })

  const totalCount = await db.select({ count: sql<number>`count(*)` }).from(articles)
  const totalPages = Math.ceil(Number(totalCount[0].count) / perPage)

  return (
    <div>
      <h1>Articles</h1>
      
      <table>
        {/* Articles table */}
      </table>

      <Pagination currentPage={page} totalPages={totalPages} />
    </div>
  )
}
```

#### 2. Admin Ads List
File: `app/(payload)/admin/ads/page.tsx`

Same pattern for ads management.

#### 3. Admin Users List
File: `app/(payload)/admin/users/page.tsx`

Same pattern for users management.

#### 4. Admin Newsletters List
File: `app/(payload)/admin/newsletters/page.tsx`

Same pattern for newsletters.

## Part 3: Google Ads Placement Recommendations

### For Unpaid Users:

1. **Article Pages** - Sidebar (already implemented with custom ads)
   - Add Google Ads below custom ads or alternate them

2. **Homepage** - Between article sections
   ```tsx
   <GoogleAd adSlot="XXXXXXXXXX" adFormat="horizontal" className="my-8" />
   ```

3. **Category Pages** - After every 6 articles
   ```tsx
   {index > 0 && index % 6 === 0 && (
     <GoogleAd adSlot="XXXXXXXXXX" adFormat="rectangle" />
   )}
   ```

4. **Article Content** - Between paragraphs (for long articles)
   - Insert after 3rd or 4th paragraph

5. **Newsletter Archive** - Between newsletters

### Ad Formats:
- **Auto**: Responsive, adapts to container
- **Horizontal**: Banner ads (728x90, 970x90)
- **Vertical**: Skyscraper ads (160x600, 300x600)
- **Rectangle**: Medium rectangle (300x250)
- **Fluid**: Fills container width

## Part 4: Testing

### Test Pagination:
1. Create 50+ articles
2. Navigate to homepage
3. Check pagination appears
4. Click through pages
5. Verify URL updates with ?page=2, ?page=3, etc.

### Test Google Ads:
1. Use AdSense test mode during development
2. Check browser console for errors
3. Verify ads load after page renders
4. Test on mobile and desktop

## Part 5: Performance Optimization

### Lazy Load Ads:
```tsx
'use client'

import { useEffect, useState } from 'react'
import GoogleAd from '@/components/ads/GoogleAd'

export default function LazyGoogleAd({ adSlot }: { adSlot: string }) {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
        }
      },
      { rootMargin: '200px' }
    )

    const element = document.getElementById('ad-container')
    if (element) observer.observe(element)

    return () => observer.disconnect()
  }, [])

  return (
    <div id="ad-container">
      {isVisible && <GoogleAd adSlot={adSlot} />}
    </div>
  )
}
```

## Summary

✅ Google Ads component created
✅ Pagination component created
✅ Implementation guide provided
✅ Examples for all major pages
✅ Admin side pagination included
✅ Performance optimization tips

Next steps:
1. Get Google AdSense approval
2. Add AdSense ID to environment variables
3. Create ad units in AdSense dashboard
4. Implement pagination on all list pages
5. Add Google Ads to strategic locations
