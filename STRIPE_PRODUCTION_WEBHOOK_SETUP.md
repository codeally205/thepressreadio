# Stripe Production Webhook Setup Guide

## Problem
After completing Stripe payment in production, the UI shows "Expired" status because the webhook is not updating the database with the subscription information.

## Root Cause
Stripe webhooks are not configured in production, so when a user completes payment:
1. Stripe creates the subscription successfully
2. User is redirected back to `/account?success=true`
3. But the database is never updated because no webhook fired
4. The UI shows old/expired subscription data

## Solution: Configure Stripe Webhooks in Production

### Step 1: Get Your Production URL
Your production URL is: `https://thepressreadio-production.up.railway.app`

### Step 2: Configure Webhook in Stripe Dashboard

1. Go to [Stripe Dashboard](https://dashboard.stripe.com)
2. Navigate to **Developers** > **Webhooks**
3. Click **Add endpoint**
4. Enter webhook URL: `https://thepressreadio-production.up.railway.app/api/webhooks/stripe`
5. Select events to listen for:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
6. Click **Add endpoint**

### Step 3: Get Webhook Signing Secret

1. After creating the endpoint, click on it
2. Click **Reveal** under "Signing secret"
3. Copy the secret (starts with `whsec_`)

### Step 4: Add Secret to Production Environment

Add the webhook secret to your Railway environmen