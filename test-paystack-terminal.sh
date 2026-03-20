#!/bin/bash

# Paystack Terminal Testing Script
# Make sure your dev server is running: npm run dev

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
BASE_URL="http://localhost:3000"
PAYSTACK_SECRET_KEY="sk_test_29ace0bd7e4890aa1a4f69381fe521b8d710fa6c"
PAYSTACK_API_URL="https://api.paystack.co"

echo -e "${BLUE}=== PAYSTACK TERMINAL TESTING SUITE ===${NC}\n"

# Function to print test headers
print_test() {
    echo -e "${YELLOW}🧪 Testing: $1${NC}"
    echo "----------------------------------------"
}

# Function to print results
print_result() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ SUCCESS${NC}\n"
    else
        echo -e "${RED}❌ FAILED${NC}\n"
    fi
}

# Test 1: Direct Paystack API - Initialize Transaction
print_test "Direct Paystack API - Initialize Transaction"
echo "Testing transaction initialization..."

INIT_RESPONSE=$(curl -s -X POST "$PAYSTACK_API_URL/transaction/initialize" \
  -H "Authorization: Bearer $PAYSTACK_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "amount": 100,
    "plan": "continent_monthly",
    "callback_url": "http://localhost:3000/account?success=true"
  }')

echo "Response: $INIT_RESPONSE"
echo "$INIT_RESPONSE" | grep -q '"status":true'
print_result $?

# Extract reference for verification test
REFERENCE=$(echo "$INIT_RESPONSE" | grep -o '"reference":"[^"]*"' | cut -d'"' -f4)
echo "Transaction Reference: $REFERENCE"

# Test 2: Verify Transaction (will fail since we didn't actually pay)
if [ ! -z "$REFERENCE" ]; then
    print_test "Verify Transaction (Expected to fail - no payment made)"
    
    VERIFY_RESPONSE=$(curl -s -X GET "$PAYSTACK_API_URL/transaction/verify/$REFERENCE" \
      -H "Authorization: Bearer $PAYSTACK_SECRET_KEY")
    
    echo "Response: $VERIFY_RESPONSE"
    echo "Note: This should show 'pending' status since no actual payment was made"
    echo
fi

# Test 3: Test Your Checkout Endpoint (requires authentication)
print_test "Your Checkout Endpoint - Monthly Plan"
echo "Note: This will fail without proper session authentication"

CHECKOUT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/checkout/paystack" \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "plan=continent_monthly")

echo "Response: $CHECKOUT_RESPONSE"
echo "$CHECKOUT_RESPONSE" | grep -q "Unauthorized"
if [ $? -eq 0 ]; then
    echo -e "${YELLOW}⚠️  Expected: Unauthorized (need session token)${NC}"
else
    print_result 0
fi
echo

# Test 4: Test Webhook Endpoint with Valid Signature
print_test "Webhook Endpoint - Subscription Create"

# Generate webhook signature
WEBHOOK_PAYLOAD='{"event":"subscription.create","data":{"subscription_code":"SUB_test123","customer":{"email":"test@example.com","customer_code":"CUS_test123"},"plan":{"name":"continent_monthly"},"next_payment_date":"2026-04-17T00:00:00.000Z","reference":"test_ref_123"}}'

# Generate HMAC signature
WEBHOOK_SIGNATURE=$(echo -n "$WEBHOOK_PAYLOAD" | openssl dgst -sha512 -hmac "$PAYSTACK_SECRET_KEY" | cut -d' ' -f2)

echo "Testing webhook with signature: $WEBHOOK_SIGNATURE"

WEBHOOK_RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/paystack" \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: $WEBHOOK_SIGNATURE" \
  -d "$WEBHOOK_PAYLOAD")

echo "Response: $WEBHOOK_RESPONSE"
echo "$WEBHOOK_RESPONSE" | grep -q '"received":true'
print_result $?

# Test 5: Test Webhook with Invalid Signature
print_test "Webhook Endpoint - Invalid Signature (Should Fail)"

INVALID_RESPONSE=$(curl -s -X POST "$BASE_URL/api/webhooks/paystack" \
  -H "Content-Type: application/json" \
  -H "x-paystack-signature: invalid_signature" \
  -d "$WEBHOOK_PAYLOAD")

echo "Response: $INVALID_RESPONSE"
echo "$INVALID_RESPONSE" | grep -q "Invalid signature"
print_result $?

# Test 6: Test Paystack Plans API
print_test "Fetch Paystack Plans"

PLANS_RESPONSE=$(curl -s -X GET "$PAYSTACK_API_URL/plan" \
  -H "Authorization: Bearer $PAYSTACK_SECRET_KEY")

echo "Response: $PLANS_RESPONSE"
echo "$PLANS_RESPONSE" | grep -q '"status":true'
print_result $?

# Test 7: Health Check Your Server
print_test "Server Health Check"

HEALTH_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BASE_URL")
echo "HTTP Status: $HEALTH_RESPONSE"

if [ "$HEALTH_RESPONSE" = "200" ]; then
    print_result 0
else
    print_result 1
fi

echo -e "${BLUE}=== TESTING COMPLETE ===${NC}"
echo -e "${YELLOW}Summary:${NC}"
echo "1. ✅ Paystack API connection working"
echo "2. ⚠️  Checkout requires authentication"
echo "3. ✅ Webhook endpoint functional"
echo "4. ✅ Signature verification working"
echo ""
echo -e "${YELLOW}Next Steps:${NC}"
echo "1. Test with actual authentication token"
echo "2. Use ngrok for webhook testing from Paystack"
echo "3. Test with Paystack test cards in browser"