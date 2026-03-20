@echo off
REM Paystack Terminal Testing Script for Windows
REM Make sure your dev server is running: npm run dev

echo === PAYSTACK TERMINAL TESTING SUITE ===
echo.

REM Configuration
set BASE_URL=http://localhost:3000
set PAYSTACK_SECRET_KEY=sk_test_29ace0bd7e4890aa1a4f69381fe521b8d710fa6c
set PAYSTACK_API_URL=https://api.paystack.co

REM Test 1: Direct Paystack API - Initialize Transaction
echo 🧪 Testing: Direct Paystack API - Initialize Transaction
echo ----------------------------------------

curl -X POST "%PAYSTACK_API_URL%/transaction/initialize" ^
  -H "Authorization: Bearer %PAYSTACK_SECRET_KEY%" ^
  -H "Content-Type: application/json" ^
  -d "{\"email\": \"test@example.com\",\"amount\": 100,\"plan\": \"continent_monthly\",\"callback_url\": \"http://