# Simple Paystack API Test
$PAYSTACK_SECRET_KEY = "sk_test_29ace0bd7e4890aa1a4f69381fe521b8d710fa6c"

Write-Host "Testing Paystack API Connection..." -ForegroundColor Yellow

# Test 1: Simple API call to verify connection
try {
    $response = Invoke-RestMethod -Uri "https://api.paystack.co/plan" -Method Get -Headers @{
        "Authorization" = "Bearer $PAYSTACK_SECRET_KEY"
    }
    
    Write-Host "✅ API Connection: SUCCESS" -ForegroundColor Green
    Write-Host "Plans found: $($response.data.Count)"
    
    foreach ($plan in $response.data) {
        Write-Host "  - $($plan.name): $($plan.currency) $($plan.amount/100) ($($plan.interval))" -ForegroundColor Cyan
    }
} catch {
    Write-Host "❌ API Connection: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
}

# Test 2: Initialize transaction with correct endpoint
Write-Host "`nTesting Transaction Initialize..." -ForegroundColor Yellow

$body = @{
    email = "test@example.com"
    amount = 108900  # Amount in kobo (GHS 1089.00)
    currency = "GHS"
    callback_url = "http://localhost:3000/account?success=true"
} | ConvertTo-Json

try {
    $initResponse = Invoke-RestMethod -Uri "https://api.paystack.co/transaction/initialize" -Method Post -Headers @{
        "Authorization" = "Bearer $PAYSTACK_SECRET_KEY"
        "Content-Type" = "application/json"
    } -Body $body
    
    Write-Host "✅ Transaction Initialize: SUCCESS" -ForegroundColor Green
    Write-Host "Authorization URL: $($initResponse.data.authorization_url)"
    Write-Host "Reference: $($initResponse.data.reference)"
    
} catch {
    Write-Host "❌ Transaction Initialize: FAILED" -ForegroundColor Red
    Write-Host "Error: $($_.Exception.Message)"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode)"
}

Write-Host "`n=== Summary ===" -ForegroundColor Blue
Write-Host "Your Paystack integration is ready for testing!"
Write-Host "Next: Test the full checkout flow in your browser"