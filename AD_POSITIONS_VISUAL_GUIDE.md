# Ad Positions Visual Guide

## Overview
Your ad system has TWO main positions where ads can be displayed:

---

## 1. SIDEBAR Position (`position: 'sidebar'`)

### Where it appears:
- **Homepage** - Right sidebar (desktop) or bottom (mobile)
- **Category pages** - Right sidebar
- **Article pages** - Right sidebar (small cards)
- **Main layout** - Persistent sidebar across the site

### Component Used:
- `AdsSidebar.tsx` - Shows 2 ads at a time with auto-rotation
- `ArticleSidebarAds.tsx` - Compact version for article pages

### Visual Characteristics:
- **Fancy design** with holographic effects, animated backgrounds
- **Purple/blue gradient** styling
- **"SPONSORED" badge** in top-right corner
- **Auto-rotates** every 10 seconds if more than 2 ads
- Shows **2 ads at once** (stacked vertically)

### Fetched with:
```typescript
getActiveAds('sidebar', 'unsubscribed', 8)
```

### Example locations in your logs:
```
🔍 Fetching ads with: position=sidebar, targetAudience=unsubscribed, limit=8
✅ Found 8 ads matching criteria
📋 Ads returned (in priority order):
1. "first ad" (Priority: 0)
2. "ADD test" (Priority: 10)
3. "African Fashion Week" (Priority: 60)
4. "Learn African Languages" (Priority: 70)
5. "African Dating App" (Priority: 72)
6. "Legal Services Online" (Priority: 73)
7. "Fitness & Wellness" (Priority: 75)
8. "African Wedding Planners" (Priority: 76)
```

---

## 2. INLINE Position (`position: 'inline'`)

### Where it appears:
- **Article pages ONLY** - Inside the article content (middle of the text)
- Appears between paragraphs in the article body

### Component Used:
- `InlineAds.tsx` - Large horizontal ad card

### Visual Characteristics:
- **Larger format** - takes full width of article content
- **Horizontal layout** - Image on left, content on right (desktop)
- **Blue/purple gradient** buttons
- **"SPONSORED" badge** at top
- **Auto-rotates** every 15 seconds (slower than sidebar)
- Shows **1 ad at a time**

### Fetched with:
```typescript
getActiveAds('inline', 'unsubscribed', 5)
```

### Example locations in your logs:
```
🔍 Fetching ads with: position=inline, targetAudience=unsubscribed, limit=5
✅ Found 5 ads matching criteria
📋 Ads returned (in priority order):
1. "Cloud Services Africa" (Priority: 71)
2. "African Car Marketplace" (Priority: 74)
3. "Learn African Languages" (Priority: 97)
4. "African Tech Summit 2026" (Priority: 98)
5. "Premium Business News" (Priority: 99)
```

---

## Visual Comparison

### SIDEBAR Ads:
```
┌─────────────────────┐
│  [SPONSORED]        │
│  ┌───────────────┐  │
│  │               │  │
│  │    Image      │  │
│  │               │  │
│  └───────────────┘  │
│  Title              │
│  Description        │
│  [Learn More →]     │
└─────────────────────┘
┌─────────────────────┐
│  [SPONSORED]        │
│  ┌───────────────┐  │
│  │               │  │
│  │    Image      │  │
│  │               │  │
│  └───────────────┘  │
│  Title              │
│  Description        │
│  [Learn More →]     │
└─────────────────────┘
```

### INLINE Ads:
```
┌────────────────────────────────────────────────────┐
│                  [Advertisement]                    │
│  ┌──────────────┐  ┌──────────────────────────┐   │
│  │              │  │  [SPONSORED]              │   │
│  │              │  │  Title                    │   │
│  │    Image     │  │  Description text here... │   │
│  │              │  │  [Learn More →]           │   │
│  │              │  │                           │   │
│  └──────────────┘  └──────────────────────────┘   │
└────────────────────────────────────────────────────┘
```

---

## How to Test Position Changes

### Test 1: Change Sidebar Ad to Inline
1. Go to `/admin/ads`
2. Find an ad with `position: sidebar` (e.g., "African Dating App")
3. Click edit
4. Change position to "Article Content" (inline)
5. Save
6. **Expected Result:**
   - Ad disappears from homepage sidebar
   - Ad appears in article pages (inside article content)

### Test 2: Change Inline Ad to Sidebar
1. Go to `/admin/ads`
2. Find an ad with `position: inline` (e.g., "Cloud Services Africa")
3. Click edit
4. Change position to "Sidebar"
5. Save
6. **Expected Result:**
   - Ad disappears from article content
   - Ad appears in homepage/category page sidebar

---

## Current Ad Distribution (from your logs)

### Sidebar Ads (8 total):
1. first ad (Priority: 0)
2. ADD test (Priority: 10)
3. African Fashion Week (Priority: 60)
4. Learn African Languages (Priority: 70)
5. African Dating App (Priority: 72)
6. Legal Services Online (Priority: 73)
7. Fitness & Wellness (Priority: 75)
8. African Wedding Planners (Priority: 76)

### Inline Ads (5 total):
1. Cloud Services Africa (Priority: 71)
2. African Car Marketplace (Priority: 74)
3. Learn African Languages (Priority: 97)
4. African Tech Summit 2026 (Priority: 98)
5. Premium Business News (Priority: 99)

---

## Key Files

### Ad Display Components:
- `components/ads/AdsSidebar.tsx` - Sidebar ads (homepage, categories)
- `components/ads/InlineAds.tsx` - Inline ads (article content)
- `components/ads/ArticleSidebarAds.tsx` - Compact sidebar ads (articles)

### Ad Fetching:
- `lib/ads.ts` - `getActiveAds(position, targetAudience, limit)`

### Pages Using Ads:
- `app/(site)/page.tsx` - Homepage (sidebar ads)
- `app/(site)/article/[slug]/page.tsx` - Article pages (both sidebar and inline)
- `components/layout/Sidebar.tsx` - Global sidebar (sidebar ads)

---

## Admin Dashboard Position Field

In the admin dashboard edit form:
```
Position: [Dropdown]
  ├─ Sidebar ────────> Shows in sidebar (homepage, categories, articles)
  └─ Article Content ─> Shows inside article text (inline)
```

The dropdown values:
- `sidebar` = Sidebar position
- `inline` = Article Content position

---

## Testing Checklist

- [ ] Can see sidebar ads on homepage
- [ ] Can see sidebar ads on article pages (right side)
- [ ] Can see inline ads inside article content (middle of text)
- [ ] Changing position from sidebar to inline moves the ad
- [ ] Changing position from inline to sidebar moves the ad
- [ ] Position persists after page refresh
- [ ] Position shows correctly in admin list
- [ ] Position shows correctly when editing again
