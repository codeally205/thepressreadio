# 🔄 Restart Instructions - Fix Database Schema Issues

## Problem
Your Next.js dev server is using cached schema and has a stale session with an invalid user ID.

## Solution

### Step 1: Stop the Dev Server
Press `Ctrl+C` in your terminal to stop the Next.js dev server.

### Step 2: Clear Browser Data
1. Open your browser's Developer Tools (F12)
2. Go to Application tab (Chrome) or Storage tab (Firefox)
3. Clear:
   - Cookies for `localhost:3000`
   - Local Storage for `localhost:3000`
   - Session Storage for `localhost:3000`

OR simply open an Incognito/Private window

### Step 3: Restart Dev Server
```bash
npm run dev
```

### Step 4: Log In Again
1. Go to http://localhost:3000
2. Log in with one of these existing users:
   - blinktechnologies125@gmail.com
   - bienvenuealliance45@gmail.com
   - filalliance769@gmail.com

### Step 5: Test the Flow
1. Go to /subscribe
2. Try starting a free trial
3. Should work now!

---

## What Was Fixed

✅ Database migration completed successfully
✅ New columns added:
  - `upgraded_from_trial_id`
  - `payment_reference`
✅ Indexes created for performance
✅ Foreign key constraints in place

## Current Database State

**Users in database:**
- bienvenuealliance45@gmail.com
- bienvenuealliance@gmail.com
- blinktechnologies125@gmail.com
- test-continent@example.com
- filalliance769@gmail.com

**Subscriptions:**
- 1 active
- 4 cancelled (expired trials cleaned up)

---

## If Issues Persist

### Check if dev server picked up changes:
```bash
# In a new terminal while dev server is running
node scripts/check-database-state.mjs
```

### Verify your session:
1. Open browser DevTools
2. Go to Application > Cookies
3. Look for `next-auth.session-token`
4. If it exists, delete it and log in again

### Manual database check:
```bash
node scripts/verify-payment-system.mjs
```

---

## Quick Test Commands

```bash
# 1. Check database state
node scripts/check-database-state.mjs

# 2. Verify payment system health
node scripts/verify-payment-system.mjs

# 3. Clean up any expired trials
node scripts/cleanup-expired-trials.mjs
```

---

## Expected Behavior After Restart

✅ /account page loads without errors
✅ Can start free trial
✅ Trial subscription created with new fields
✅ Payment flow works correctly
✅ Status updates properly after payment

---

## Troubleshooting

### Error: "column does not exist"
**Solution:** Restart dev server (it's using cached schema)

### Error: "user_id not present in table"
**Solution:** Clear browser cookies and log in again

### Error: "Failed to create trial"
**Solution:** Check that you're logged in with a valid user

---

## Production Deployment

When deploying to production:

1. **Run migration on production database:**
   ```bash
   # Set production DATABASE_URL
   export DATABASE_URL="your_production_db_url"
   node scripts/migrate-add-fields.mjs
   ```

2. **Deploy code changes**

3. **Verify with:**
   ```bash
   node scripts/verify-payment-system.mjs
   ```

4. **Monitor logs** for any issues

---

**Status:** Ready to test after restart
**Next Step:** Stop dev server, clear cookies, restart, log in
