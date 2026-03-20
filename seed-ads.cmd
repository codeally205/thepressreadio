@echo off
echo 🚀 Seeding ads for slideshow testing...

REM Check if .env file exists
if not exist ".env" (
    echo ❌ .env file not found. Please make sure you have a .env file with DATABASE_URL
    pause
    exit /b 1
)

echo 📊 Running ads seeding script...
node scripts/seed-ads-simple.mjs

if %errorlevel% equ 0 (
    echo.
    echo ✅ Ads seeding completed successfully!
    echo.
    echo 🎯 Next steps:
    echo 1. Visit your homepage while logged out ^(or as unsubscribed user^)
    echo 2. Look at the sidebar on the right
    echo 3. Watch the ads rotate every 10 seconds
    echo 4. You should see 2 ads at a time, rotating through all 10 ads
    echo 5. Hover over the ads area to pause the slideshow
) else (
    echo ❌ Error running ads seeding script
)

pause