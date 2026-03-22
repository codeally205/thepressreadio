# Tracking Issues Found and Fixes

## Issues Identified

### 1. Article View Counts Not Syncing
- **Problem**: The `article_views` table has 155 records, but all articles show 0 in `view_count` column
- **Root Cause**: Article views are being inserted directly in the page component (server-side) without calling the API endpoint that updates the count
- **Impact**: Analytics dashboard and article listings show incorrect view counts

### 2. Article View Tracking Implementation
- **Problem**: Views are tracked server-side in `app/(site)/article/[slug]/page.tsx` but the API endpoint `/api/articles/[slug]/view` is never called
- **Root Cause**: No client-side component to trigger the view tracking API
- **Impact**: The `articles.view_count` column never gets incremented

### 3. Ad Tracking Working But Could Be Better
- **Status**: Ad impressions and clicks ARE being tracked correctly
- **Data**: 691 ad interactions recorded, impressions being counted
- **Minor Issue**: Could add better deduplication for ad impressions

## Fixes Required

### Fix 1: Sync Existing Article View Counts
Run a one-time migration to sync the view counts from article_views to articles table

### Fix 2: Add Client-Side Article View Tracking
Create a client component that calls the view tracking API endpoint

### Fix 3: Update Article Page to Use Client-Side Tracking
Remove server-side view insertion and use client-side tracking instead
