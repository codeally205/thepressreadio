# How to See Ad Position Changes

## The Problem
Your ad positions ARE updating in the database correctly, but you're seeing cached data in your browser.

## Current Database State (Confirmed Working ✓)
- **Sidebar ads:** 29 ads
- **Inline ads:** 8 ads (including "Fitness & Wellness" which you just moved)

## Solution: Clear the Cache

### Method 1: Hard Refresh Browser (Quickest)
1. Go to your homepage: `http://localhost:3000`
2. Press one of these key combinations:
   - **Windows:** `Ctrl + Shift + R` or `Ctrl + F5`
   - **Mac:** `Cmd + Shift + R`
3. This forces the browser to reload without using cache

### Method 2: Clear Browser Cache
1. Open DevTools (F12)
2. Right-click the refresh button
3. Select "Empty Cache and Hard Reload"

### Method 3: Restart Dev Server (Most Reliable)
1. In your terminal, press `Ctrl + C` to stop the dev server
2. Run `npm run dev` again
3. Wait for it to compile
4. Go to `http://localhost:3000`

### Method 4: Use Incognito/Private Window
1. Open a new incognito/private browser window
2. Go to `http://localhost:3000`
3. This bypasses all cache

## What I Fixed

I added these lines to prevent caching:

### Homepage (`app/(site)/page.tsx`)
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

### Article Page (`app/(site)/article/[slug]/page.tsx`)
```typescript
export const dynamic = 'force-dynamic'
export const revalidate = 0
```

### Admin Pages (already done)
- `app/(payload)/admin/ads/page.tsx`
- `app/(payload)/admin/ads/[id]/edit/page.tsx`

## How to Verify It's Working

### Step 1: Check Database
Run this command to see current positions:
```bash
node check-current-ad-positions.mjs
```

You should see:
- **Sidebar:** 29 ads (NOT including "Fitness & Wellness")
- **Inline:** 8 ads (INCLUDING "Fitness & Wellness")

### Step 2: Check Homepage
1. Hard refresh the homepage
2. Count the ads in the sidebar
3. You should see FEWER than 8 ads now (because some moved to inline)

### Step 3: Check Article Page
1. Go to any article
2. Scroll down through the article content
3. You should see "Fitness & Wellness" ad INSIDE the article text (not in sidebar)

## Expected Behavior After Cache Clear

### Homepage Sidebar
Should show these 8 ads (from the 29 sidebar ads, showing top 8 by priority):
1. first ad (Priority: 0)
2. ADD test (Priority: 10)
3. African Fashion Week (Priority: 60)
4. Learn African Languages (Priority: 70)
5. African Dating App (Priority: 72)
6. Legal Services Online (Priority: 73)
7. African Wedding Planners (Priority: 76)
8. Cryptocurrency Exchange (Priority: 77)

### Article Content (Inline)
Should show these ads rotating inside article text:
1. Cloud Services Africa
2. African Car Marketplace
3. **Fitness & Wellness** ← This one you just moved!
4. Learn African Languages
5. African Tech Summit 2026
6. Premium Business News
7. Invest in African Markets

## Still Not Working?

If you still see the old ads after trying all methods above:

1. **Check your terminal logs** - Look for these lines:
   ```
   🔍 Fetching ads with: position=sidebar, targetAudience=unsubscribed, limit=8
   ✅ Found X ads matching criteria
   ```

2. **Check browser console** - Look for any errors

3. **Verify the ad ID** - Make sure you're editing the right ad:
   - Fitness & Wellness ID: `27e4290c-1f30-4d71-b8bd-258630004b8c`

4. **Run the check script again**:
   ```bash
   node check-current-ad-positions.mjs
   ```

## Why This Happened

Next.js caches pages by default for performance. When you changed the ad position:
1. ✅ Database updated correctly
2. ✅ API returned correct data
3. ❌ Browser showed cached HTML

Now with `dynamic = 'force-dynamic'`, Next.js will:
- Always fetch fresh data
- Never cache the page
- Show real-time ad positions

## Test the Fix

1. Restart your dev server
2. Hard refresh your browser
3. Run: `node check-current-ad-positions.mjs`
4. Compare what you see on the homepage with the database results

The numbers should match!
