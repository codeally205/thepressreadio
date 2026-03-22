# Article & Ad Tracking Fixes - Complete

## Issues Fixed

### 1. ✅ Article View Counts Synced
- **Action**: Ran `sync-article-view-counts.mjs` to sync existing view data
- **Result**: 33 articles updated with correct view counts from `article_views` table
- **Top Article**: "The great depression test" with 31 views

### 2. ✅ Client-Side Article View Tracking Implemented
- **Created**: `components/article/ArticleViewTracker.tsx` - Client component that tracks views
- **Features**:
  - Tracks view after 2-second delay (ensures user is actually reading)
  - Only tracks once per page load
  - Calls the API endpoint that properly updates both tables
  
### 3. ✅ Updated Article Page Component
- **Removed**: Server-side view tracking (was only inserting into `article_views` table)
- **Added**: `<ArticleViewTracker slug={params.slug} />` component
- **Benefit**: Now properly calls API endpoint which updates BOTH:
  - `article_views` table (for detailed analytics)
  - `articles.view_count` column (for quick display in lists)

### 4. ✅ Ad Tracking Already Working
- **Status**: Ad impressions and clicks are being tracked correctly
- **Data**: 691 ad interactions recorded
- **Top Ad**: "first ad" with 290 impressions and 69 clicks

## How It Works Now

### Article Views
1. User visits article page
2. `ArticleViewTracker` component mounts (client-side)
3. After 2 seconds, it calls `POST /api/articles/[slug]/view`
4. API endpoint:
   - Checks for duplicate views (same IP within 1 hour)
   - Inserts record into `article_views` table
   - Increments `articles.view_count` column
5. Both analytics dashboard AND articles list show correct counts

### Ad Views
1. Ad component renders with ad data
2. `useEffect` tracks impression for each visible ad
3. Calls `GET /api/ads/[id]/impression`
4. API endpoint:
   - Inserts record into `ad_interactions` table
   - Increments `ads.impressions` column
5. Returns 1x1 transparent pixel

## Testing

### Test Article Views
1. Visit any article page
2. Wait 2 seconds
3. Check admin articles list - view count should increment
4. Check analytics dashboard - should show the view

### Test Ad Views
1. Visit homepage or article page (as non-subscriber)
2. Ads should be visible in sidebar
3. Check admin ads list - impressions should increment
4. Click an ad - clicks should increment

## Maintenance

### Periodic Sync (Optional)
If you want to ensure view counts stay in sync, you can run:
```bash
node sync-article-view-counts.mjs
```

This will recalculate all view counts from the `article_views` table.

### Monitor Tracking
To check tracking status anytime:
```bash
node check-tracking-issues.mjs
```

## Files Modified
- ✅ `app/(site)/article/[slug]/page.tsx` - Removed server-side tracking, added client component
- ✅ `components/article/ArticleViewTracker.tsx` - New client-side tracker
- ✅ Database - Synced view counts for all articles

## Files Created
- `sync-article-view-counts.mjs` - One-time sync script
- `check-tracking-issues.mjs` - Diagnostic script
- `components/article/ArticleViewTracker.tsx` - Client tracker component
- `fix-tracking-issues.md` - Issue documentation
- `fix-tracking-complete.md` - This file
