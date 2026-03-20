#!/usr/bin/env pwsh

# Clean Invalid Ad Images Script
Write-Host "🧹 Cleaning invalid ad image URLs..." -ForegroundColor Green

# Load environment variables from .env file
if (Test-Path ".env") {
    Get-Content ".env" | ForEach-Object {
        if ($_ -match "^([^#][^=]+)=(.*)$") {
            $name = $matches[1].Trim()
            $value = $matches[2].Trim()
            [Environment]::SetEnvironmentVariable($name, $value, "Process")
        }
    }
    Write-Host "✅ Environment variables loaded" -ForegroundColor Green
} else {
    Write-Host "❌ .env file not found" -ForegroundColor Red
    exit 1
}

# Get database URL
$DATABASE_URL = $env:DATABASE_URL
if (-not $DATABASE_URL) {
    Write-Host "❌ DATABASE_URL not found in environment variables" -ForegroundColor Red
    exit 1
}

Write-Host "📊 Database URL found" -ForegroundColor Green

# Run the cleanup script
Write-Host "🔄 Running ad image cleanup..." -ForegroundColor Blue

try {
    node scripts/clean-invalid-ad-images.mjs
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "🎉 Ad image cleanup completed successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Summary:" -ForegroundColor Cyan
        Write-Host "   • Invalid image URLs have been removed from ads" -ForegroundColor White
        Write-Host "   • Ads will now only display images from approved sources:" -ForegroundColor White
        Write-Host "     - Cloudinary (res.cloudinary.com)" -ForegroundColor White
        Write-Host "     - Unsplash (images.unsplash.com)" -ForegroundColor White
        Write-Host "     - Google Photos (lh3.googleusercontent.com)" -ForegroundColor White
        Write-Host "     - Vercel Blob Storage" -ForegroundColor White
        Write-Host ""
        Write-Host "💡 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Use the admin interface to upload new images to Cloudinary" -ForegroundColor White
        Write-Host "   2. Restart your development server for config changes to take effect" -ForegroundColor White
    } else {
        Write-Host "❌ Ad image cleanup failed" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Error running cleanup script: $_" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "✨ All done!" -ForegroundColor Green