#!/usr/bin/env pwsh

Write-Host "🚀 Seeding ads for slideshow testing..." -ForegroundColor Green

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "❌ .env file not found. Please make sure you have a .env file with DATABASE_URL" -ForegroundColor Red
    exit 1
}

# Load environment variables from .env file
Get-Content .env | ForEach-Object {
    if ($_ -match "^([^#][^=]+)=(.*)$") {
        [Environment]::SetEnvironmentVariable($matches[1], $matches[2], "Process")
    }
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not found in environment variables" -ForegroundColor Red
    exit 1
}

Write-Host "📊 DATABASE_URL found, proceeding with ads seeding..." -ForegroundColor Yellow

# Run the seeding script
try {
    node scripts/seed-ads-simple.mjs
    Write-Host "✅ Ads seeding completed successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "🎯 Next steps:" -ForegroundColor Cyan
    Write-Host "1. Visit your homepage while logged out (or as unsubscribed user)" -ForegroundColor White
    Write-Host "2. Look at the sidebar on the right" -ForegroundColor White
    Write-Host "3. Watch the ads rotate every 10 seconds" -ForegroundColor White
    Write-Host "4. You should see 2 ads at a time, rotating through all 10 ads" -ForegroundColor White
    Write-Host "5. Hover over the ads area to pause the slideshow" -ForegroundColor White
} catch {
    Write-Host "❌ Error running ads seeding script: $_" -ForegroundColor Red
    exit 1
}