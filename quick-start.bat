@echo off
title TheWoob VIP - Quick Launch

echo.
echo ^🎩 TheWoob VIP Marketplace - Quick Launch
echo =========================================
echo.

REM Change to the script directory
cd /d "%~dp0"

REM Check if we have npm
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ^❌ Node.js/npm not found. Please install Node.js first.
    echo    Download from: https://nodejs.org
    pause
    exit /b 1
)

REM Quick setup and launch
echo ^🚀 Setting up and launching marketplace...

REM Install dependencies if needed
if not exist "node_modules" (
    echo ^📦 Installing dependencies...
    npm install --silent
)

REM Generate Prisma client and update database
echo ^🗄️  Setting up database...
npx prisma generate >nul 2>&1
npx prisma db push >nul 2>&1

REM Create .env if it doesn't exist
if not exist ".env" (
    echo ^🔧 Creating environment file...
    (
        echo DATABASE_URL="file:./dev.db"
        echo SESSION_PASSWORD="thewoob-super-secret-session-key-2025-vip-club-elite-access"
        echo STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
        echo NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
        echo STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
        echo FEE_PERCENT="0.10"
        echo NODE_ENV="development"
    ) > .env
)

echo.
echo ^✅ Ready! Your VIP marketplace is starting...
echo.
echo ^📍 Opening: http://localhost:3000
echo ^🛡️  Admin panel: http://localhost:3000/admin
echo ^💡 Your admin email: admin@thewoob.com
echo.
echo ^🎯 To make yourself admin:
echo    node scripts/make-admin.js your-email@example.com
echo.
echo ^🚀 Press Ctrl+C to stop when done
echo.

REM Start the server
npm run dev
