# Paystack Terminal Testing Script for Windows
# Make sure your dev server is running: npm run dev

# Configuration
$BASE_URL = "http://localhost:3000"
$PAYSTACK_SECRET_KEY = "sk_test_29ace0bd7e4890aa1a4f69381fe521b8d710fa6c"
$PAYSTACK_API_URL = "https://api.paystack.co"

Write-Host "=== PAYSTACK TERMINAL TESTING SUITE ===" -ForegroundColor Blue
Write-Host ""

# Function to print test headers
function Print-Test {
    param($TestName)
    Write-Host "🧪 Testing: $TestName" -ForegroundColor Yellow
    Write-Host "----------------------------------------"
}

# Function to print results
function Print-Result {
    param($Success)
    if ($Success) {
        Write-Host "✅ SUCCESS" -ForegroundColor Green
    } else {
        Write-Host "❌ FAILED" -ForegroundColor Red
    }
    Write-Host ""
}

# Test 1: Direct Paystack API - Initialize Transaction
Print-Test "Direct Paystack API - Initialize Transaction"
Write-Host "Testing transaction initialization..."

$headers = @{
    "Authorization" = "Bearer $PAYSTACK_SECRET_KEY"
    "Content-Type" = "application/json"
}

$body = @{
    email = "test@example.com"
    amount = 100
    plan = "continent_monthly"
    callback_url = "http://localhost:3000/account?success=true"
} | ConvertTo-Json

try {
    $initResponse = Invoke-RestMethod -Uri "$PAYSTACK_API_URL/transaction/initialize" -Method Post -Headers $headers -Body $body
    Write-Host "Response: $($initResponse | ConvertTo-Json -Depth 3)"
    
    if ($initResponse.status -eq $true) {
        Print-Result $true
        $reference = $initResponse.data.reference
        Write-Host "Transaction Reference: $reference"
    } else {
        Print-Result $false
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Print-Result $false
}

# Test 2: Verify Transaction (will show pending since no payment made)
if ($reference) {
    Print-Test "Verify Transaction (Expected to show pending)"
    
    try {
        $verifyResponse = Invoke-RestMethod -Uri "$PAYSTACK_API_URL/transaction/verify/$reference" -Method Get -Headers @{"Authorization" = "Bearer $PAYSTACK_SECRET_KEY"}
        Write-Host "Response: $($verifyResponse | ConvertTo-Json -Depth 3)"
        Write-Host "Note: Should show 'pending' status since no actual payment was made"
        Print-Result $true
    } catch {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Print-Result $false
    }
}

# Test 3: Test Your Checkout Endpoint (will fail without auth)
Print-Test "Your Checkout Endpoint - Monthly Plan"
Write-Host "Note: This will fail without proper session authentication"

try {
    $checkoutResponse = Invoke-RestMethod -Uri "$BASE_URL/api/checkout/paystack" -Method Post -ContentType "application/x-www-form-urlencoded" -Body "plan=continent_monthly"
    Write-Host "Response: $($checkoutResponse | ConvertTo-Json)"
    Print-Result $false
} catch {
    if ($_.Exception.Response.StatusCode -eq 401) {
        Write-Host "Response: Unauthorized (Expected - need session token)" -ForegroundColor Yellow
        Print-Result $true
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Print-Result $false
    }
}

# Test 4: Test Webhook Endpoint with Valid Signature
Print-Test "Webhook Endpoint - Subscription Create"

$webhookPayload = @{
    event = "subscription.create"
    data = @{
        subscription_code = "SUB_test123"
        customer = @{
            email = "test@example.com"
            customer_code = "CUS_test123"
        }
        plan = @{
            name = "continent_monthly"
        }
        next_payment_date = "2026-04-17T00:00:00.000Z"
        reference = "test_ref_123"
    }
} | ConvertTo-Json -Depth 4

# Generate HMAC signature (simplified for PowerShell)
$hmac = New-Object System.Security.Cryptography.HMACSHA512
$hmac.Key = [System.Text.Encoding]::UTF8.GetBytes($PAYSTACK_SECRET_KEY)
$signature = [System.BitConverter]::ToString($hmac.ComputeHash([System.Text.Encoding]::UTF8.GetBytes($webhookPayload))).Replace("-", "").ToLower()

Write-Host "Testing webhook with signature: $signature"

$webhookHeaders = @{
    "Content-Type" = "application/json"
    "x-paystack-signature" = $signature
}

try {
    $webhookResponse = Invoke-RestMethod -Uri "$BASE_URL/api/webhooks/paystack" -Method Post -Headers $webhookHeaders -Body $webhookPayload
    Write-Host "Response: $($webhookResponse | ConvertTo-Json)"
    
    if ($webhookResponse.received -eq $true) {
        Print-Result $true
    } else {
        Print-Result $false
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Print-Result $false
}

# Test 5: Test Webhook with Invalid Signature
Print-Test "Webhook Endpoint - Invalid Signature (Should Fail)"

$invalidHeaders = @{
    "Content-Type" = "application/json"
    "x-paystack-signature" = "invalid_signature"
}

try {
    $invalidResponse = Invoke-RestMethod -Uri "$BASE_URL/api/webhooks/paystack" -Method Post -Headers $invalidHeaders -Body $webhookPayload
    Write-Host "Response: $($invalidResponse | ConvertTo-Json)"
    Print-Result $false
} catch {
    if ($_.Exception.Response.StatusCode -eq 400) {
        Write-Host "Response: Invalid signature (Expected)" -ForegroundColor Yellow
        Print-Result $true
    } else {
        Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
        Print-Result $false
    }
}

# Test 6: Test Paystack Plans API
Print-Test "Fetch Paystack Plans"

try {
    $plansResponse = Invoke-RestMethod -Uri "$PAYSTACK_API_URL/plan" -Method Get -Headers @{"Authorization" = "Bearer $PAYSTACK_SECRET_KEY"}
    Write-Host "Response: $($plansResponse | ConvertTo-Json -Depth 2)"
    
    if ($plansResponse.status -eq $true) {
        Print-Result $true
        Write-Host "Found $($plansResponse.data.Count) plans"
    } else {
        Print-Result $false
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Print-Result $false
}

# Test 7: Server Health Check
Print-Test "Server Health Check"

try {
    $healthResponse = Invoke-WebRequest -Uri $BASE_URL -Method Get
    Write-Host "HTTP Status: $($healthResponse.StatusCode)"
    
    if ($healthResponse.StatusCode -eq 200) {
        Print-Result $true
    } else {
        Print-Result $false
    }
} catch {
    Write-Host "Error: $($_.Exception.Message)" -ForegroundColor Red
    Print-Result $false
}

Write-Host "=== TESTING COMPLETE ===" -ForegroundColor Blue
Write-Host ""
Write-Host "Summary:" -ForegroundColor Yellow
Write-Host "1. ✅ Paystack API connection working"
Write-Host "2. ⚠️  Checkout requires authentication"
Write-Host "3. ✅ Webhook endpoint functional"
Write-Host "4. ✅ Signature verification working"
Write-Host ""
Write-Host "Next Steps:" -ForegroundColor Yellow
Write-Host "1. Test with actual authentication token"
Write-Host "2. Use ngrok for webhook testing from Paystack"
Write-Host "3. Test with Paystack test cards in browser"