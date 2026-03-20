# Quick Start Guide - Database Setup

Follow these steps to set up your database and get the platform running.

## Step 1: Choose Your Database Option

### 🌟 RECOMMENDED: Neon (Easiest)

1. Go to **https://neon.tech**
2. Click **"Sign Up"** (free tier available)
3. Create a new project called **"african-news-platform"**
4. Copy both connection strings shown:
   - **Pooled connection** (for DATABASE_URL)
   - **Direct connection** (for DATABASE_URL_UNPOOLED)

### Alternative: Local PostgreSQL

See `scripts/setup-database.md` for local installation instructions.

---

## Step 2: Create Environment File

```bash
cp .env.example .env.local
```

Open `.env.local` and add your database URLs:

```env
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
DATABASE_URL_UNPOOLED=postgresql://user:password@host/dbname?sslmode=require
```

---

## Step 3: Test Database Connection

```bash
pnpm db:check
```

You should see:
```
✅ Database connection successful!
✅ Database permissions OK
```

---

## Step 4: Generate and Run Migrations

```bash
pnpm db:generate
```

This creates migration files in the `drizzle` folder.

```bash
pnpm db:migrate
```

This applies the migrations to your database.

---

## Step 5: Apply Performance Indexes

### For Neon:
1. Go to your Neon dashboard
2. Click on **"SQL Editor"**
3. Copy the contents of `drizzle/indexes.sql`
4. Paste and run in the SQL Editor

### For Local PostgreSQL:
```bash
psql -U postgres -d african_news -f drizzle/indexes.sql
```

Or use pgAdmin to run the SQL file.

---

## Step 6: Add Other Environment Variables

In `.env.local`, add these (get from respective services):

```env
# NextAuth (generate with: openssl rand -base64 32)
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# For now, you can use dummy values to test:
GOOGLE_CLIENT_ID=dummy
GOOGLE_CLIENT_SECRET=dummy
STRIPE_SECRET_KEY=sk_test_dummy
STRIPE_PUBLISHABLE_KEY=pk_test_dummy
PAYSTACK_SECRET_KEY=sk_test_dummy
RESEND_API_KEY=re_dummy
PAYLOAD_SECRET=your-payload-secret
```

---

## Step 7: Start the Development Server

The server should already be running. If not:

```bash
pnpm dev
```

Visit **http://localhost:3000**

---

## Step 8: Create Admin User

1. Go to **http://localhost:3000/admin**
2. Create your first admin account
3. Start creating articles!

---

## Troubleshooting

### "DATABASE_URL not found"
- Make sure `.env.local` exists
- Check the file has DATABASE_URL set
- Restart the dev server

### "Connection refused"
- For Neon: Check project is active
- For Local: Check PostgreSQL is running
- Verify the connection string is correct

### "Permission denied"
- Check database user has CREATE TABLE permissions
- For Neon: This should work by default

### Migration errors
- Make sure DATABASE_URL_UNPOOLED is set
- Try running migrations again
- Check database exists

---

## Need Help?

1. Check `scripts/setup-database.md` for detailed instructions
2. Check `SETUP.md` for full setup guide
3. Check `DEPLOYMENT.md` for production setup

---

## Quick Commands Reference

```bash
# Check database connection
pnpm db:check

# Generate migrations
pnpm db:generate

# Run migrations
pnpm db:migrate

# Open Drizzle Studio (database GUI)
pnpm db:studio

# Start dev server
pnpm dev

# Build for production
pnpm build
```
