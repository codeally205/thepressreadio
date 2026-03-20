@echo off
echo === Creating African News Database ===
echo.
echo This will create a database called 'african_news'
echo.
echo Enter your PostgreSQL password when prompted
echo.

psql -U postgres -c "CREATE DATABASE african_news;"

if %ERRORLEVEL% EQU 0 (
    echo.
    echo ✓ Database created successfully!
    echo.
    echo Your connection string:
    echo postgresql://postgres:YOUR_PASSWORD@localhost:5432/african_news
    echo.
    echo Next: Update .env.local with your connection string
) else (
    echo.
    echo Database might already exist or there was an error.
    echo Try connecting manually: psql -U postgres
)

pause
