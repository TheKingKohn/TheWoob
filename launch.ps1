# TheWoob VIP Marketplace - PowerShell Launcher v2.0
# Complete setup and startup script for Windows

$Host.UI.RawUI.WindowTitle = "TheWoob VIP Marketplace Launcher v2.0"

Write-Host ""
Write-Host "TheWoob VIP Marketplace Launcher v2.0" -ForegroundColor Magenta
Write-Host "===============================================" -ForegroundColor Cyan
Write-Host "Elite marketplace for trusted local members" -ForegroundColor Yellow
Write-Host ""

# Function to check if command exists
function Test-Command($command) {
    try {
        Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    } catch {
        return $false
    }
}

# Check Node.js installation
Write-Host "Checking Node.js installation..." -ForegroundColor Cyan
if (-not (Test-Command "node")) {
    Write-Host "❌ Node.js not found. Please install Node.js from https://nodejs.org" -ForegroundColor Red
    Write-Host "   Minimum version required: 18.0.0" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

$nodeVersion = node --version
Write-Host "Node.js found: $nodeVersion" -ForegroundColor Green

# Check dependencies
Write-Host "Checking dependencies..." -ForegroundColor Cyan
if (-not (Test-Path "node_modules")) {
    Write-Host "Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        Write-Host "   Try running: npm install --legacy-peer-deps" -ForegroundColor Yellow
        Read-Host "Press Enter to exit"
        exit 1
    }
    Write-Host "Dependencies installed successfully" -ForegroundColor Green
} else {
    Write-Host "Dependencies already installed" -ForegroundColor Green
}

# Check environment file
Write-Host "Checking environment configuration..." -ForegroundColor Cyan
if (-not (Test-Path ".env")) {
    Write-Host "Creating .env file with defaults..." -ForegroundColor Yellow
    
    $envContent = @"
# TheWoob VIP Marketplace Environment Configuration
# Database
DATABASE_URL="file:./dev.db"

# Session Security
SESSION_PASSWORD="thewoob-super-secret-session-key-2025-vip-club-elite-access"

# Stripe Configuration (Get from: https://dashboard.stripe.com/test/apikeys)
STRIPE_SECRET_KEY="sk_test_your_stripe_secret_key_here"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_your_stripe_publishable_key_here"
STRIPE_WEBHOOK_SECRET="whsec_your_webhook_secret_here"

# Platform Settings
FEE_PERCENT="0.10"

# Environment
NODE_ENV="development"
"@
    
    $envContent | Set-Content -Path ".env" -Encoding UTF8
    Write-Host "Environment file created with defaults" -ForegroundColor Green
    Write-Host "IMPORTANT: Update .env with your actual Stripe keys for payments!" -ForegroundColor Yellow
    Write-Host "   - Test keys from: https://dashboard.stripe.com/test/apikeys" -ForegroundColor Yellow
} else {
    Write-Host "Environment file found" -ForegroundColor Green
}

# Set up Prisma and Database
Write-Host "Setting up database and Prisma..." -ForegroundColor Cyan

Write-Host "Generating Prisma client..." -ForegroundColor Yellow
npx prisma generate
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma client" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Ensuring database is up to date..." -ForegroundColor Yellow
npx prisma db push
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to update database" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Database setup completed" -ForegroundColor Green

# Check for admin account
Write-Host "Checking admin account..." -ForegroundColor Cyan
$adminEmail = Read-Host "Enter your admin email (or press Enter for admin@thewoob.com)"
if ([string]::IsNullOrWhiteSpace($adminEmail)) {
    $adminEmail = "admin@thewoob.com"
}

Write-Host "Ensuring admin account exists for: $adminEmail" -ForegroundColor Yellow
node scripts/make-admin.js $adminEmail 2>$null
if ($LASTEXITCODE -eq 0) {
    Write-Host "Admin account ready" -ForegroundColor Green
} else {
    Write-Host "Admin account not found - create account first, then run:" -ForegroundColor Yellow
    Write-Host "   node scripts/make-admin.js $adminEmail" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "Setup complete! Starting TheWoob VIP Marketplace..." -ForegroundColor Green
Write-Host ""
Write-Host "Your marketplace will be available at: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:3000" -ForegroundColor White
Write-Host "Sign in at: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:3000/signin" -ForegroundColor White
Write-Host "Admin dashboard at: " -NoNewline -ForegroundColor Cyan
Write-Host "http://localhost:3000/admin" -ForegroundColor White

Write-Host ""
Write-Host "VIP Features:" -ForegroundColor Magenta
Write-Host "   - Light/Dark theme toggle" -ForegroundColor White
Write-Host "   - Video uploads (50MB limit)" -ForegroundColor White
Write-Host "   - Real-time messaging" -ForegroundColor White
Write-Host "   - Review system" -ForegroundColor White
Write-Host "   - Admin controls" -ForegroundColor White
Write-Host "   - Stripe payments" -ForegroundColor White

Write-Host ""
Write-Host "Test Payment Info:" -ForegroundColor Yellow
Write-Host "   - Card: 4242 4242 4242 4242" -ForegroundColor White
Write-Host "   - Expiry: Any future date" -ForegroundColor White
Write-Host "   - CVC: Any 3 digits" -ForegroundColor White

Write-Host ""
Write-Host "Quick Links:" -ForegroundColor Green
Write-Host "   - Create listings: http://localhost:3000/sell/new" -ForegroundColor White
Write-Host "   - Browse marketplace: http://localhost:3000/browse" -ForegroundColor White
Write-Host "   - Dashboard: http://localhost:3000/dashboard" -ForegroundColor White
Write-Host "   - Messages: http://localhost:3000/messages" -ForegroundColor White
Write-Host "   - Profile: http://localhost:3000/profile" -ForegroundColor White

Write-Host ""
Write-Host "Admin Commands:" -ForegroundColor Cyan
Write-Host "   - Promote user to admin: node scripts/make-admin.js email@example.com" -ForegroundColor White
Write-Host "   - View database: npx prisma studio (opens in browser)" -ForegroundColor White

Write-Host ""
Write-Host "Press Ctrl+C to stop the server when done" -ForegroundColor Yellow
Write-Host ""

Write-Host "Starting Cloudflare Tunnel for www.thewoob.com..." -ForegroundColor Cyan
Start-Process -NoNewWindow -FilePath "cloudflared" -ArgumentList "tunnel run thewoob-tunnel"
Start-Sleep -Seconds 5
Write-Host "Starting VIP marketplace server..." -ForegroundColor Magenta
npm run dev
