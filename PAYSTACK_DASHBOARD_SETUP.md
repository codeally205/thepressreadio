# Paystack Dashboard Setup Guide

## Complete Setup Checklist for Your African News CMS

### 1. Account Setup & Verification

#### Initial Account Creation
1. **Sign up** at [https://paystack.com](https://paystack.com)
2. **Verify your email** address
3. **Complete business verification**:
   - Business name: "The Press Radio" (or your business name)
   - Business type: Media/Publishing
   - Country: Nigeria (or your primary African market)
   - Upload required documents (CAC certificate, ID, etc.)

#### Business Information
- **Business Category**: Media & Entertainment
- **Website**: Your domain (e.g., thepressradio.com)
- **Description**: African news and media platform with subscription services

### 2. API Keys Configuration

#### Test Environment (Development)
1. Go to **Settings** → **API Keys & Webhooks**
2. Copy your **Test Keys**:
   ```
   Test Public Key: pk_test_xxxxx (already in your .env)
   Test Secret Key: sk_test_xxxxx (already in your .env)
   ```

#### Live Environment (Production)
1. After business verification, get **Live Keys**:
   ```
   Live Public Key: pk_live_xxxxx
   Live Secret Key: sk_live_xxxxx
   ```
2. **Update your production .env**:
   ```bash
   PAYSTACK_SECRET_KEY=sk_live_your_live_key_here
   PAYSTACK_PUBLIC_KEY=pk_live_your_live_key_here
   ```

### 3. Webhook Configuration

#### Step 1: Create Webhook Endpoint
1. Go to **Settings** → **API Keys & Webhooks**
2. Click **"Add Webhook Endpoint"**
3. **Configure webhook**:
   ```
   URL: https://yourdomain.com/api/webhooks/paystack
   
   For local testing:
   URL: https://your-ngrok-url.ngrok.io/api/webhooks/paystack
   ```

#### Step 2: Select Events
Enable these specific events that your system handles:
- ✅ **subscription.create** - When subscription is created
- ✅ **charge.success** - When payment succeeds
- ✅ **subscription.disable** - When subscription is cancelled
- ✅ **invoice.create** - When invoice is generated
- ✅ **invoice.payment_failed** - When payment fails

#### Step 3: Webhook Security
1. **Copy the webhook secret** (if provided)
2. **Test webhook delivery** using Paystack's test feature

### 4. Subscription Plans Setup ✅ ALREADY CONFIGURED

Your Paystack dashboard shows these plans are already set up correctly:

#### Plan 1: continent_monthly ✅
- **Plan Code**: PLN_1f6dterorakwQvy
- **Amount**: GHS 10.89 (≈$1 USD)
- **Interval**: Monthly
- **Status**: Active

#### Plan 2: continent_yearly ✅  
- **Plan Code**: PLN_9epje7eogkaj6x
- **Amount**: GHS 108.86 (≈$10 USD)
- **Interval**: Annually
- **Status**: Active

**Target Audience**: Africans on the continent
**Payment Methods**: Cards, Bank Transfer, Mobile Money, USSD

**Note**: Diaspora plans ($1-$5/month) will use Stripe (skipped for now)

### 5. Payment Methods Configuration

#### Enable Payment Channels
1. Go to **Settings** → **Payment Preferences**
2. **Enable these channels**:
   - ✅ **Cards** (Visa, Mastercard, Verve)
   - ✅ **Bank Transfer** (Nigerian banks)
   - ✅ **USSD** (for feature phones)
   - ✅ **Mobile Money** (MTN, Airtel, etc.)
   - ✅ **QR Code** payments

#### Currency Settings
1. **Primary Currency**: USD (for international compatibility)
2. **Secondary Currency**: NGN (for local users)
3. **Auto-conversion**: Enable for seamless experience

### 6. Customer Management

#### Customer Settings
1. Go to **Customers** → **Settings**
2. **Configure**:
   - ✅ **Auto-create customers** from transactions
   - ✅ **Send receipt emails** to customers
   - ✅ **Customer dashboard** access

### 7. Email & Notification Setup

#### Email Templates
1. Go to **Settings** → **Email Templates**
2. **Customize templates** for:
   - Payment receipts
   - Subscription confirmations
   - Failed payment notifications
   - Subscription cancellations

#### Notification Settings
1. **Admin notifications**:
   - ✅ New subscriptions
   - ✅ Failed payments
   - ✅ Chargebacks
   - ✅ Refunds

### 8. Security & Compliance

#### Security Settings
1. Go to **Settings** → **Security**
2. **Enable**:
   - ✅ **Two-factor authentication**
   - ✅ **IP whitelisting** (for production)
   - ✅ **Webhook signature verification**

#### Compliance
1. **PCI DSS**: Automatically handled by Paystack
2. **Data Protection**: Configure according to your privacy policy
3. **Transaction limits**: Set appropriate limits for your business

### 9. Testing Configuration

#### Test Mode Setup
1. **Switch to Test Mode** (toggle in dashboard)
2. **Use test cards** for validation:
   ```
   Success: 5060 6666 6666 6666 6666
   Decline: 5060 0000 0000 0000 0000
   ```

#### Webhook Testing
1. Use **ngrok** for local testing:
   ```bash
   # Install ngrok
   npm install -g ngrok
   
   # Expose local server
   ngrok http 3000
   
   # Use the HTTPS URL in webhook settings
   ```

### 10. Production Deployment Checklist

#### Pre-Launch
- [ ] Business verification completed
- [ ] Live API keys configured
- [ ] Webhook endpoint tested with live URL
- [ ] Subscription plans created and active
- [ ] Payment methods enabled
- [ ] Email templates customized
- [ ] Security settings configured

#### Launch Day
- [ ] Switch from test to live keys
- [ ] Update webhook URL to production
- [ ] Test complete subscription flow
- [ ] Monitor webhook delivery
- [ ] Check email notifications

### 11. Monitoring & Analytics

#### Dashboard Monitoring
1. **Transactions**: Monitor payment success rates
2. **Subscriptions**: Track active/cancelled subscriptions
3. **Revenue**: Analyze monthly recurring revenue
4. **Customers**: Monitor customer growth

#### Set Up Alerts
1. **Failed payments**: Get notified immediately
2. **Webhook failures**: Monitor delivery issues
3. **Unusual activity**: Security alerts

### 12. Integration Verification

#### Test These Flows
1. **New Subscription**:
   - User selects plan → Paystack checkout → Payment → Webhook → Database update

2. **Recurring Payment**:
   - Paystack charges customer → Webhook → Subscription renewal

3. **Cancellation**:
   - User cancels → Paystack disables → Webhook → Database update

#### Webhook Delivery Test
```bash
# Test webhook with curl
curl -X POST https://yourdomain.com/api/webhooks/paystack \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: YOUR_SIGNATURE" \
  -d '{"event":"subscription.create","data":{"subscription_code":"SUB_test"}}'
```

### 13. Common Configuration Issues

#### Issue: Webhook not receiving events
**Solution**: 
- Check webhook URL is accessible
- Verify SSL certificate is valid
- Ensure endpoint returns 200 status

#### Issue: Subscription plans not found
**Solution**:
- Verify plan codes match exactly
- Check plan is active in dashboard
- Ensure currency matches

#### Issue: Payment failures
**Solution**:
- Check payment method availability
- Verify customer location restrictions
- Review transaction limits

### 14. Support & Resources

#### Paystack Support
- **Email**: support@paystack.com
- **Documentation**: https://paystack.com/docs
- **Community**: Paystack Slack/Discord

#### Integration Support
- **API Reference**: https://paystack.com/docs/api/
- **Webhooks Guide**: https://paystack.com/docs/payments/webhooks/
- **SDKs**: Available for multiple languages

---

## Quick Setup Summary

1. ✅ **Account verified** and business approved
2. ✅ **API keys** configured (test → live)
3. ✅ **Webhook endpoint** set up with correct events
4. ✅ **Subscription plans** created with matching codes
5. ✅ **Payment methods** enabled for your target markets
6. ✅ **Email templates** customized
7. ✅ **Security settings** configured
8. ✅ **Testing completed** in test mode
9. ✅ **Production deployment** with live keys
10. ✅ **Monitoring** set up for ongoing operations

Your Paystack integration will be fully functional once all these steps are completed!