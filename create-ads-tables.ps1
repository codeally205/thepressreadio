#!/usr/bin/env pwsh

# Create Ads Tables Script
Write-Host "🚀 Creating ads tables in the database..." -ForegroundColor Green

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

# Check if psql is available
$psqlExists = $false
try {
    $null = Get-Command psql -ErrorAction Stop
    $psqlExists = $true
    Write-Host "✅ PostgreSQL client (psql) is available" -ForegroundColor Green
} catch {
    Write-Host "❌ PostgreSQL client (psql) not found." -ForegroundColor Red
    Write-Host "   You can install it from: https://www.postgresql.org/download/" -ForegroundColor Yellow
}

if ($psqlExists) {
    # Run the SQL script
    Write-Host "📝 Executing ads tables creation script..." -ForegroundColor Blue
    
    $result = psql $DATABASE_URL -f "scripts/create-ads-tables.sql"
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✅ Ads tables created successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "📋 Created tables:" -ForegroundColor Cyan
        Write-Host "   • ads - Main advertisements table" -ForegroundColor White
        Write-Host "   • ad_interactions - Click and impression tracking" -ForegroundColor White
        Write-Host ""
        Write-Host "🎯 Next steps:" -ForegroundColor Yellow
        Write-Host "   1. Visit /admin/ads to manage advertisements" -ForegroundColor White
        Write-Host "   2. Visit homepage to see ads (when not subscribed)" -ForegroundColor White
        Write-Host "   3. Create new ads via the admin interface" -ForegroundColor White
    } else {
        Write-Host "❌ Failed to create ads tables" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host ""
    Write-Host "📝 Manual SQL execution required:" -ForegroundColor Yellow
    Write-Host "   Please run the SQL commands in scripts/create-ads-tables.sql" -ForegroundColor White
    Write-Host "   against your PostgreSQL database manually." -ForegroundColor White
}

Write-Host ""
Write-Host "🎉 Setup complete!" -ForegroundColor Green