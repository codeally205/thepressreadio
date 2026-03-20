# Paystack Testing Guide - Current Setup

## Your Current Configuration ✅

Based on your Paystack dashboard screenshot, you have:

### Active Plans
- **continent_monthly**: GHS 10.89 (≈$1 USD) - Monthly
- **continent_yearly**: GHS 108.86 (≈$10 USD) - Annually

### Target Market
- **Africans on Continent**: Paystack (cards, mobile money, bank transfer)
- **Africans Abroad**: Stripe (skipped for now)

## Testing Your Current Setup

### 1. Test Monthly Subscription Flow

#### Postman Request:
```http
POST http://localhost:3000/api/checkout/paystack
Content-Type: application/x-www-form-urlencoded
Cookie: next-auth.session-token=YOUR_SESSION_TOKEN

Body:
plan=continent_monthly
```

#### Expected Response:
- Redirect to Paystack checkout
- Amount: GHS 10.89 (or equivalent in user's currency)
- Plan: continent_monthly

### 2. Test Yearly Subscription Flow

#### Postman Request:
```http
POST http://localhost:3000/api/checkout/paystack
Content-Type: application/x-www-form-urlencoded
Cookie: next-auth.session-token=YOUR_SESSION_TOKEN

Body:
plan=continent_yearly
```

#### Expected Response:
- Redirect to Paystack checkout
- Amount: GHS 108.86 (or equivalent)
- Plan: continent_yearly

### 3. Test Webhook Events

Your webhook should handle these events for the active plans:

#### Subscription Creation Webhook:
```json
{
  "event": "subscription.create",
  "data": {
    "subscription_code": "SUB_xxx",
    "customer": {
      "email": "user@example.com",
      "customer_code": "CUS_xxx"
    },
    "plan": {
      "name": "continent_monthly",
      "plan_code": "PLN_1f6dterorakwQvy"
    },
    "next_payment_date": "2026-04-17T00:00:00.000Z"
  }
}
```

#### Payment Success Webhook:
```json
{
  "event": "charge.success",
  "data": {
    "amount": 1089,
    "currency": "GHS",
    "customer": {
      "email": "user@example.com",
      "customer_code": "CUS_xxx"
    },
    "plan": {
      "name": "continent_monthly",
      "plan_code": "PLN_1f6dterorakwQvy"
    }
  }
}
```

## Mobile Money Considerations

### Current Setup
- Both monthly and yearly plans support mobile money
- Consider if mobile money users prefer yearly (as noted)

### Potential Enhancement
If mobile money users prefer yearly subscriptions, you could:

1. **Add a mobile money specific yearly plan**:
```javascript
mobile_money_yearly: {
  name: 'Mobile Money Yearly',
  price: 10,
  currency: 'GHS',
  interval: 'year',
  processor: 'paystack',
}
```

2. **Detect payment method** and show appropriate plans
3. **Create separate Paystack plan** for mobile money users

## Testing Checklist

### ✅ Basic Flow Testing
- [ ] Monthly plan checkout works
- [ ] Yearly plan checkout works  
- [ ] Webhook receives subscription.create
- [ ] Webhook receives charge.success
- [ ] Database records created correctly
- [ ] Email notifications sent

### ✅ Payment Method Testing
- [ ] Card payments work (test cards)
- [ ] Bank transfer initiated
- [ ] Mobile money options available
- [ ] USSD codes generated

### ✅ Currency Handling
- [ ] GHS amounts display correctly
- [ ] USD conversion works
- [ ] Local currency preferences respected

## Quick Test Commands

### Generate Webhook Signature:
```bash
node generate-paystack-signature.js
```

### Test Webhook Locally:
```bash
# Start ngrok
ngrok http 3000

# Update webhook URL in Paystack dashboard
# Test with generated signatures
```

### Check Database Records:
```sql
-- Check active subscriptions
SELECT u.email, s.plan, s.status, s.paystack_subscription_code 
FROM users u 
JOIN subscriptions s ON u.id = s.user_id 
WHERE s.payment_processor = 'paystack' 
AND s.status = 'active';
```

## Production Deployment

### Before Going Live:
1. **Switch to live API keys** in Paystack dashboard
2. **Update webhook URL** to production domain
3. **Test with real payment methods**
4. **Monitor first few transactions** closely

### Live Testing:
- Use small amounts for initial tests
- Test all payment methods (cards, mobile money, bank transfer)
- Verify webhook delivery in production
- Check email notifications work

Your setup looks solid! The main thing to test is the complete flow from checkout → payment → webhook → database update.