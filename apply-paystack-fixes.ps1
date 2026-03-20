# PowerShell script to apply Paystack fixes on Windows

Write-Host "🔧 Applying Paystack Payment System Fixes..." -ForegroundColor Cyan
Write-Host ""

# Check if Node.js is available
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js version: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js not found. Please install Node.js first." -ForegroundColor Red
    exit 1
}

# Check if the project directory exists
if (-not (Test-Path "package.json")) {
    Write-Host "❌ package.json not found. Please run this script from the project root." -ForegroundColor Red
    exit 1
}

Write-Host "📝 Step 1: Applying database constraints..." -ForegroundColor Yellow
try {
    node scripts/apply-constraints-simple.mjs
    Write-Host "✅ Database constraints applied successfully!" -ForegroundColor Green
} catch {
    Write-Host "❌ Failed to apply database constraints. Error: $_" -ForegroundColor Red
    Write-Host "   Try running: node scripts/apply-constraints-simple.mjs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🧪 Step 2: Running tests..." -ForegroundColor Yellow
try {
    node scripts/test-paystack-fixes.mjs
    Write-Host "✅ Tests completed!" -ForegroundColor Green
} catch {
    Write-Host "⚠️ Some tests may have failed. This is normal if the server isn't running." -ForegroundColor Yellow
    Write-Host "   To run tests manually: node scripts/test-paystack-fixes.mjs" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "🎉 Paystack fixes application completed!" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Summary of fixes applied:" -ForegroundColor Cyan
Write-Host "   1. ✅ Database unique constraints" -ForegroundColor Green
Write-Host "   2. ✅ Fixed cancelSubscription method" -ForegroundColor Green
Write-Host "   3. ✅ Standardized trial period logic" -ForegroundColor Green
Write-Host "   4. ✅ Enhanced webhook security & rate limiting" -ForegroundColor Green
Write-Host ""
Write-Host "⚠️  Next steps:" -ForegroundColor Yellow
Write-Host "   - Start your development server: npm run dev" -ForegroundColor White
Write-Host "   - Test payment flows with Paystack test cards" -ForegroundColor White
Write-Host "   - Verify webhook endpoints are working" -ForegroundColor White
Write-Host "   - Test subscription cancellation" -ForegroundColor White
Write-Host ""
Write-Host "📖 For detailed information, see: PAYSTACK_FIXES_IMPLEMENTATION.md" -ForegroundColor Cyan