#!/bin/bash

# TheWoob Marketplace Launcher (Cross-platform version)
# Run this script to set up and launch your local marketplace

echo "🚀 TheWoob Marketplace Launcher"
echo "==============================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
NC='\033[0m' # No Color

# Check if Node.js is installed
echo -e "${YELLOW}📦 Checking Node.js installation...${NC}"
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    echo -e "${GREEN}✅ Node.js found: $NODE_VERSION${NC}"
else
    echo -e "${RED}❌ Node.js not found. Please install Node.js from https://nodejs.org${NC}"
    read -p "Press Enter to exit"
    exit 1
fi

# Check if dependencies are installed
echo -e "${YELLOW}📦 Checking dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${YELLOW}📥 Installing dependencies...${NC}"
    npm install
    if [ $? -ne 0 ]; then
        echo -e "${RED}❌ Failed to install dependencies${NC}"
        read -p "Press Enter to exit"
        exit 1
    fi
    echo -e "${GREEN}✅ Dependencies installed successfully${NC}"
else
    echo -e "${GREEN}✅ Dependencies already installed${NC}"
fi

# Check if .env file exists
echo -e "${YELLOW}🔧 Checking environment configuration...${NC}"
if [ ! -f ".env" ]; then
    if [ -f ".env.example" ]; then
        echo -e "${YELLOW}📋 Creating .env file from .env.example...${NC}"
        cp ".env.example" ".env"
        echo -e "${YELLOW}⚠️  IMPORTANT: Please edit .env file with your Stripe keys!${NC}"
        echo -e "${CYAN}   - Get test keys from: https://dashboard.stripe.com/test/apikeys${NC}"
        echo -e "${CYAN}   - Update STRIPE_SECRET_KEY and NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY${NC}"
        echo -e "${CYAN}   - Generate a strong SESSION_PASSWORD (32+ characters)${NC}"
    else
        echo -e "${RED}❌ .env.example file not found${NC}"
        read -p "Press Enter to exit"
        exit 1
    fi
else
    echo -e "${GREEN}✅ Environment file found${NC}"
fi

# Check if database exists and set up Prisma
echo -e "${YELLOW}🗄️  Setting up database...${NC}"
if [ ! -f "prisma/dev.db" ]; then
    echo -e "${YELLOW}🔨 Generating Prisma client...${NC}"
    npx prisma generate
    
    echo -e "${YELLOW}🏗️  Running database migrations...${NC}"
    npx prisma migrate dev --name init
    
    echo -e "${YELLOW}🌱 Seeding database...${NC}"
    npx prisma db seed
    
    if [ $? -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Database setup completed with warnings${NC}"
    else
        echo -e "${GREEN}✅ Database setup completed successfully${NC}"
    fi
else
    echo -e "${GREEN}✅ Database already exists${NC}"
    echo -e "${YELLOW}🔄 Ensuring Prisma client is up to date...${NC}"
    npx prisma generate
fi

# Final environment check
echo -e "${YELLOW}🔍 Performing final checks...${NC}"

# Check if essential environment variables are set
if grep -q "STRIPE_SECRET_KEY=sk_test_" ".env" && grep -qE "SESSION_PASSWORD=.{32,}" ".env"; then
    echo -e "${GREEN}✅ Environment configuration looks good${NC}"
else
    echo -e "${YELLOW}⚠️  Warning: Please check your .env file configuration${NC}"
    echo -e "${CYAN}   Make sure STRIPE_SECRET_KEY and SESSION_PASSWORD are properly set${NC}"
fi

echo ""
echo -e "${GREEN}🎉 Setup complete! Starting TheWoob marketplace...${NC}"
echo ""
echo -e "${CYAN}📍 Your marketplace will be available at: http://localhost:3000${NC}"
echo -e "${CYAN}🔐 Sign in at: http://localhost:3000/signin${NC}"
echo -e "${CYAN}💳 Onboard sellers at: http://localhost:3000/onboard${NC}"
echo -e "${CYAN}🛒 Create listings at: http://localhost:3000/sell/new${NC}"
echo ""
echo -e "${YELLOW}💡 Tips:${NC}"
echo "   - Use test credit card: 4242 4242 4242 4242"
echo "   - Check dashboard at: http://localhost:3000/dashboard"
echo "   - Press Ctrl+C to stop the server"
echo ""

# Start the development server
echo -e "${MAGENTA}🚀 Launching development server...${NC}"
npm run dev
