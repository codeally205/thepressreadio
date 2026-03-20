# Paystack Integration Testing Guide

## Overview
This guide helps you test the Paystack integration in your African News CMS using Postman and other tools.

## Prerequisites
1. **Postman** installed
2. **Node.js** for running signature generator
3. **Local development server** running (`npm run dev`)
4. **Test user account** in your system

## Setup Instructions

### 1. Import Postman Collection
1. Open Postman
2. Click "Import" → "Upload Files"
3. Select `paystack-postman-collection.json`
4. The collection will be imported with all test requests

### 2. Configure Environment Variables
In Postman, set up these variables:
- `base_url`: `http://localhost:3000`
- `paystack_secret_key`: `sk_test_29ace0bd7e4890aa1a4f69381fe521b8d710fa6c`
- `paystack_public_key`: `pk_test_c6d804a01dc3a43be26d57537b8a4af6c6c39920`

## Testing Scenarios

### Scenario 1: Complete Subscription Flow

#### Step 1: Authentication
1. **Create Test User** (if not exists):
   ```bash
   # Run this in your project directory
   npm run db:seed
   ```

2. **Get Session Token**:
   - Use browser dev tools to get session token after login
   - Or use the magic link authentication endpoint

#### Step 2: Test Checkout Creation
1. **Monthly Plan**:
   ```
   POST /api/checkout/paystack
   Content-Type: application/x-www-form-urlencoded
   Cookie: next-auth.session-token=YOUR_TOKEN
   
   Body: plan=continent_monthly
   ```

2. **Yearly Plan**:
   ```
   POST /api/checkout/paystack
   Content-Type: application/x-www-form-urlencoded
   Cookie: next-auth.session-token=YOUR_TOKEN
   
   Body: plan=continent_yearly
   ```

**Expected Response**: Redirect to Paystack checkout URL

#### Step 3: Test Direct Paystack API
1. **Initialize Transaction**:
   ```
   POST https://api.paystack.co/transaction/initialize
   Authorization: Bearer sk_test_29ace0bd7e4890aa1a4f69381fe521b8d710fa6c
   Content-Type: application/json
   
   {
     "email": "test@example.com",
     "amount": 100,
     "plan": "continent_monthly",
     "callback_url": "http://localhost:3000/account?success=true"
   }
   ```

**Expected Response**:
```json
{
  "status": true,
  "message": "Authorization URL created",
  "data": {
    "authorization_url": "https://checkout.paystack.com/...",
    "access_code": "...",
    "reference": "..."
  }
}
```

### Scenario 2: Webhook Testing

#### Step 1: Generate Webhook Signatures
```bash
# Run the signature generator
node generate-paystack-signature.js
```

This will output signatures for testing different webhook events.

#### Step 2: Test Webhook Endpoints

1. **Subscription Creation**:
   ```
   POST /api/webhooks/paystack
   Content-Type: application/json
   x-paystack-signature: [GENERATED_SIGNATURE]
   
   {
     "event": "subscription.create",
     "data": {
       "subscription_code": "SUB_test123",
       "customer": {
         "email": "test@example.com",
         "customer_code": "CUS_test123"
       },
       "plan": {
         "name": "continent_monthly"
       },
       "next_payment_date": "2026-04-17T00:00:00.000Z",
       "reference": "test_ref_123"
     }
   }
   ```

2. **Payment Success**:
   ```
   POST /api/webhooks/paystack
   Content-Type: application/json
   x-paystack-signature: [GENERATED_SIGNATURE]
   
   {
     "event": "charge.success",
     "data": {
       "reference": "test_ref_456",
       "amount": 100,
       "currency": "USD",
       "plan": {
         "name": "continent_monthly"
       },
       "customer": {
         "email": "test@example.com",
         "customer_code": "CUS_test123"
       }
     }
   }
   ```

3. **Subscription Cancellation**:
   ```
   POST /api/webhooks/paystack
   Content-Type: application/json
   x-paystack-signature: [GENERATED_SIGNATURE]
   
   {
     "event": "subscription.disable",
     "data": {
       "subscription_code": "SUB_test123",
       "customer": {
         "email": "test@example.com"
       },
       "plan": {
         "name": "continent_monthly"
       },
       "reference": "test_ref_789"
     }
   }
   ```

## Test Cases Checklist

### ✅ Checkout Flow
- [ ] Monthly plan checkout creates correct Paystack transaction
- [ ] Yearly plan checkout creates correct Paystack transaction
- [ ] Invalid plan returns 400 error
- [ ] Unauthenticated request returns 401 error
- [ ] Checkout redirects to Paystack URL

### ✅ Webhook Processing
- [ ] Valid signature verification passes
- [ ] Invalid signature returns 400 error
- [ ] Subscription creation webhook creates database record
- [ ] Payment success webhook activates subscription
- [ ] Cancellation webhook updates subscription status
- [ ] Idempotency prevents duplicate processing
- [ ] Email notifications are sent for each event

### ✅ Database Integration
- [ ] Subscription records have correct Paystack fields
- [ ] Payment events are logged with processor info
- [ ] User subscription status updates correctly
- [ ] Trial periods are handled properly

### ✅ Error Handling
- [ ] Invalid webhook signatures rejected
- [ ] Missing required fields handled gracefully
- [ ] Database transaction rollback on errors
- [ ] Proper error logging and responses

## Paystack Test Cards

Use these test cards in Paystack checkout:

**Success Cards**:
- `5060 6666 6666 6666 6666` (Verve)
- `4084 0840 8408 4081` (Visa)
- `5399 8383 8383 8381` (Mastercard)

**Decline Cards**:
- `5060 0000 0000 0000 0000` (Insufficient funds)
- `4111 1111 1111 1112` (Invalid card)

## Monitoring and Debugging

### Check Database Records
```sql
-- Check subscriptions
SELECT * FROM subscriptions WHERE payment_processor = 'paystack';

-- Check payment events
SELECT * FROM payment_events WHERE processor = 'paystack';

-- Check user subscriptions
SELECT u.email, s.plan, s.status, s.paystack_subscription_code 
FROM users u 
JOIN subscriptions s ON u.id = s.user_id 
WHERE s.payment_processor = 'paystack';
```

### Check Logs
```bash
# Check application logs
tail -f logs/app.log

# Check webhook processing
grep "Paystack" logs/app.log
```

### Paystack Dashboard
1. Login to [Paystack Dashboard](https://dashboard.paystack.com)
2. Check **Transactions** for payment records
3. Check **Subscriptions** for recurring payments
4. Check **Webhooks** for delivery status

## Common Issues and Solutions

### Issue: Webhook signature verification fails
**Solution**: Ensure you're using the exact same secret key and payload format

### Issue: Subscription not created in database
**Solution**: Check webhook delivery and database connection

### Issue: Emails not sending
**Solution**: Verify Resend API key and email templates

### Issue: Checkout redirect fails
**Solution**: Check Paystack API keys and network connectivity

## Production Deployment Notes

1. **Replace test keys** with live Paystack keys
2. **Configure webhook URL** in Paystack dashboard
3. **Set up monitoring** for webhook failures
4. **Test with real cards** in staging environment
5. **Monitor subscription lifecycle** events

## Support Resources

- [Paystack API Documentation](https://paystack.com/docs/api/)
- [Paystack Webhook Guide](https://paystack.com/docs/payments/webhooks/)
- [Test Cards Reference](https://paystack.com/docs/payments/test-payments/)