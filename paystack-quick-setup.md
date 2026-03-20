# Paystack Quick Setup Reference

## 🚀 Essential Dashboard Settings

### 1. Webhook Configuration
**Location**: Settings → API Keys & Webhooks → Add Webhook Endpoint

```
URL: https://yourdomain.com/api/webhooks/paystack
Events to Enable:
✅ subscription.create
✅ charge.success  
✅ subscription.disable
✅ invoice.create
✅ invoice.payment_failed
```

### 2. Subscription Plans
**Location**: Subscriptions → Plans → Create Plan

**Plan 1:**
```
Name: continent_monthly
Code: continent_monthly
Amount: $1.00 USD
Interval: Monthly
```

**Plan 2:**
```
Name: continent_yearly  
Code: continent_yearly
Amount: $10.00 USD
Interval: Yearly
```

### 3. Payment Methods
**Location**: Settings → Payment Preferences

Enable:
- ✅ Cards (Visa, Mastercard, Verve)
- ✅ Bank Transfer
- ✅ Mobile Money
- ✅ USSD

### 4. API Keys
**Location**: Settings → API Keys & Webhooks

**Test Keys** (Development):
```
Public: pk_test_c6d804a01dc3a43be26d57537b8a4af6c6c39920
Secret: sk_test_29ace0bd7e4890aa1a4f69381fe521b8d710fa6c
```

**Live Keys** (Production):
```
Public: pk_live_[get_from_dashboard]
Secret: sk_live_[get_from_dashboard]
```

## 🧪 Testing Setup

### Local Development Webhook
```bash
# Install ngrok
npm install -g ngrok

# Expose local server  
ngrok http 3000

# Use HTTPS URL in Paystack webhook settings
https://abc123.ngrok.io/api/webhooks/paystack
```

### Test Cards
```
Success: 5060 6666 6666 6666 6666
Decline: 5060 0000 0000 0000 0000
```

## ⚡ Critical Settings Checklist

- [ ] Business verification completed
- [ ] Webhook URL configured with correct events
- [ ] Subscription plans created with exact codes
- [ ] Payment methods enabled for target regions
- [ ] Test mode working with ngrok
- [ ] Live keys ready for production
- [ ] Email notifications configured