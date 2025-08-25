@echo off
title TheWoob VIP Marketplace Launcher v2.0

REM TheWoob VIP Marketplace - Complete Launcher for Windows
REM Handles setup, database, admin account, and server startup

echo.
echo TheWoob VIP Marketplace Launcher v2.0
echo ===============================================
echo Elite marketplace for trusted local members
echo.

REM Check if Node.js is installed
echo Checking Node.js installation...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ^❌ Node.js not found. Please install Node.js from https://nodejs.org
    echo    Minimum version required: 18.0.0
    pause
    exit /b 1
)

for /f "tokens=*" %%i in ('node --version') do set NODE_VERSION=%%i
echo Node.js found: %NODE_VERSION%

REM Check if dependencies are installed
echo Checking dependencies...
if not exist "node_modules" (
    echo Installing dependencies...
    call npm install
    if %errorlevel% neq 0 (
        echo ^❌ Failed to install dependencies
        echo    Try running: npm install --legacy-peer-deps
        pause
        exit /b 1
    )
    echo Dependencies installed successfully
) else (
    echo Dependencies already installed
)

REM Check if .env file exists
echo Checking environment configuration...
if not exist ".env" (
    echo Creating .env file with defaults...
    (
        echo # TheWoob VIP Marketplace Environment Configuration
        echo # Database
        echo DATABASE_URL="file:./dev.db"
        echo # Session Security
        echo SESSION_PASSWORD="thewoob-super-secret-session-key-2025-vip-club-elite-access"
        echo # Stripe Configuration ^(Get from: https://dashboard.stripe.com/test/apikeys^)
        echo STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
        echo NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
        echo STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"
        echo # Platform Settings
        echo FEE_PERCENT="0.10"
        echo # Environment
        echo NODE_ENV="development"
    ) > .env
    echo Environment file created with defaults
    echo IMPORTANT: Update .env with your actual Stripe keys for payments!
    echo    - Test keys from: https://dashboard.stripe.com/test/apikeys
) else (
    echo Environment file found
)

REM Set up Prisma and Database
echo Setting up database and Prisma...
echo Generating Prisma client...
call npx prisma generate
if %errorlevel% neq 0 (
    echo ^❌ Failed to generate Prisma client
    pause
    exit /b 1
)

echo Ensuring database is up to date...
call npx prisma db push
if %errorlevel% neq 0 (
    echo ^❌ Failed to update database
    pause
    exit /b 1
)

echo Database setup completed

REM Check for admin account
echo Checking admin account...
set /p ADMIN_EMAIL="Enter your admin email (or press Enter for admin@thewoob.com): "
if "%ADMIN_EMAIL%"=="" set ADMIN_EMAIL=admin@thewoob.com

echo Ensuring admin account exists for: %ADMIN_EMAIL%
call node scripts/make-admin.js %ADMIN_EMAIL% 2>nul
if %errorlevel% equ 0 (
    echo Admin account ready
) else (
    echo Admin account not found - create account first, then run:
    echo    node scripts/make-admin.js %ADMIN_EMAIL%
)

echo.
echo Setup complete! Starting TheWoob VIP Marketplace...
echo.
echo Your marketplace will be available at: http://localhost:3000
echo Sign in at: http://localhost:3000/signin
echo Admin dashboard at: http://localhost:3000/admin
echo VIP features:
echo    - Light/Dark theme toggle
echo    - Video uploads ^(50MB limit^)
echo    - Real-time messaging
echo    - Review system
echo    - Admin controls
echo    - Stripe payments
echo.
echo Test Payment Info:
echo    - Card: 4242 4242 4242 4242
echo    - Expiry: Any future date
echo    - CVC: Any 3 digits
echo.
echo Quick Links:
echo    - Create listings: http://localhost:3000/sell/new
echo    - Browse marketplace: http://localhost:3000/browse
echo    - Dashboard: http://localhost:3000/dashboard
echo    - Messages: http://localhost:3000/messages
echo    - Profile: http://localhost:3000/profile
echo.
echo Admin Commands:
echo    - Promote user to admin: node scripts/make-admin.js email@example.com
echo    - View database: npx prisma studio ^(opens in browser^)
echo.
echo Press Ctrl+C to stop the server when done
echo.

REM Start the development server
echo ^🎩 Launching VIP marketplace server...
REM Check if cloudflared is installed
echo Checking for Cloudflare Tunnel (cloudflared)...
where cloudflared >nul 2>&1
if %errorlevel% neq 0 (
    echo Cloudflared not found. Please install from https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
    echo    Download and install, then ensure 'cloudflared' is in your PATH.
    pause
    exit /b 1
)
echo Cloudflared found!

REM Start Cloudflare Tunnel for www.thewoob.com
echo Starting Cloudflare Tunnel for www.thewoob.com ...
start "Cloudflare Tunnel" cmd /c "cloudflared tunnel run thewoob-tunnel"
timeout /t 5 >nul

REM Start Next.js dev server in background
start "Next.js Dev Server" cmd /c "npm run dev"
echo.
echo TheWoob VIP Marketplace is now running locally AND accessible via your custom domain!
echo Press Ctrl+C in this window to exit.
