# Resend Email Setup Guide

## Current Status
✅ Resend API key configured
✅ Updated to use onboarding domain for development
⚠️ Domain verification needed for production

## Quick Fix (Development)
Your `.env` has been updated to use:
```
RESEND_FROM_EMAIL=onboarding@resend.dev
```

This should work immediately for testing magic link authentication.

## Production Setup

### Step 1: Add Your Domain to Resend
1. Go to [Resend Domains](https://resend.com/domains)
2. Click "Add Domain"
3. Enter your domain (e.g., `thepressradio.com`)

### Step 2: Verify Domain with DNS Records
Add these DNS records to your domain provider:

**SPF Record (TXT):**
```
Name: @
Value: v=spf1 include:_spf.resend.com ~all
```

**DKIM Record (TXT):**
```
Name: resend._domainkey
Value: [Provided by Resend after adding domain]
```

**DMARC Record (TXT):**
```
Name: _dmarc
Value: v=DMARC1; p=quarantine; rua=mailto:dmarc@yourdomain.com
```

### Step 3: Update Environment Variables
After domain verification, update your production `.env`:
```
RESEND_FROM_EMAIL=noreply@yourdomain.com
```

## Testing Magic Link Authentication

### Test with Development Setup
1. Make sure your dev server is running
2. Go to `/login`
3. Enter any email address
4. Check your email for the magic link
5. Click the link to sign in

### Common Issues

**Issue: "Domain not verified"**
- Solution: Use `onboarding@resend.dev` for development
- For production: Verify your domain first

**Issue: "API key invalid"**
- Check your `RESEND_API_KEY` in `.env`
- Make sure it starts with `re_`

**Issue: "Magic link not working"**
- Check that `NE