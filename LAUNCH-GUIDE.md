# 🎩 TheWoob VIP Marketplace

**Elite marketplace for trusted local members**

A sophisticated Next.js marketplace featuring VIP club aesthetics, real-time messaging, video uploads, admin controls, and Stripe payments.

## ✨ Features

### 🎯 Core Marketplace
- **VIP Club Design** - Premium dark theme with light/dark mode toggle
- **Advanced Search** - Filter by category, price, and keywords
- **Image & Video Uploads** - Multi-image galleries + 50MB video support
- **Real-time Messaging** - Chat between buyers and sellers
- **Review System** - 5-star ratings for users
- **Responsive Design** - Mobile-optimized throughout

### 🛡️ Admin System
- **Admin Dashboard** - Platform overview with analytics
- **User Management** - Change roles, delete users
- **Content Moderation** - Remove listings, manage content
- **Security Controls** - Role-based access control
- **Platform Analytics** - Revenue, user stats, activity monitoring

### 💳 Payments
- **Stripe Integration** - Express Connect for sellers
- **Secure Payments** - Full payment processing
- **Fee Management** - Configurable platform fees
- **Payout System** - Automatic seller payouts

### 🔐 Authentication
- **Password-based Auth** - Secure bcrypt hashing
- **Session Management** - Iron-session security
- **Rate Limiting** - Brute force protection
- **Account Lockout** - Security features

## 🚀 Quick Start

### Option 1: One-Click Launch ⚡
```bash
# Double-click this file:
quick-start.bat
```

### Option 2: Full Setup 🛠️
```bash
# Windows Batch
launch.bat

# PowerShell
./launch.ps1
```

### Option 3: Manual Setup 🔧
```bash
# Install dependencies
npm install

# Set up database
npx prisma generate
npx prisma db push

# Start development server
npm run dev
```

## 🛡️ Admin Setup

1. **Create your account** at http://localhost:3000/signin
2. **Promote to admin**:
   ```bash
   node scripts/make-admin.js your-email@example.com
   ```
3. **Access admin panel** at http://localhost:3000/admin

## 🔧 Configuration

### Environment Variables (.env)
```env
# Database
DATABASE_URL="file:./dev.db"

# Session Security  
SESSION_PASSWORD="your-super-secret-session-key"

# Stripe (get from dashboard.stripe.com)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Platform Settings
FEE_PERCENT="0.10"
NODE_ENV="development"
```

### Test Payment Info 💳
- **Card**: 4242 4242 4242 4242
- **Expiry**: Any future date  
- **CVC**: Any 3 digits

## 📱 Pages & Features

| Page | URL | Description |
|------|-----|-------------|
| **Homepage** | `/` | VIP landing with hero section |
| **Browse** | `/browse` | Search and filter listings |
| **Sign In** | `/signin` | Authentication with password |
| **Dashboard** | `/dashboard` | Seller analytics and listings |
| **Messages** | `/messages` | Real-time chat system |
| **Create Listing** | `/sell/new` | List items with media |
| **Admin Panel** | `/admin` | Platform management |
| **Profile** | `/profile` | User profile and settings |

## 🎨 Theme System

- **Light/Dark Modes** - Toggle in navigation
- **VIP Aesthetics** - Premium purple/gold color scheme
- **Responsive Design** - Mobile-first approach
- **Custom Components** - Consistent design system

## 💻 Development

### Tech Stack
- **Framework**: Next.js 14.2.5
- **Database**: Prisma + SQLite
- **Authentication**: iron-session
- **Payments**: Stripe
- **Styling**: Tailwind CSS
- **Language**: TypeScript

### Scripts
```bash
# Development
npm run dev

# Build for production  
npm run build
npm start

# Database operations
npx prisma studio    # View database
npx prisma generate  # Generate client
npx prisma db push   # Update database

# Admin commands
node scripts/make-admin.js email@example.com
```

## 🌟 Advanced Features

### Video Upload System 📹
- **50MB limit** per video
- **Progress tracking** during upload
- **Drag & drop** interface
- **Format validation**

### Review System ⭐
- **5-star ratings** for users
- **Written reviews** with comments
- **Review verification** tied to orders
- **Rating aggregation** and display

### Messaging System 💬
- **Real-time chat** between users
- **Conversation history** persistence
- **Message timestamps** and status
- **Responsive chat interface**

### Admin Controls 🛡️
- **User management** - roles, banning, deletion
- **Content moderation** - listing removal
- **Platform analytics** - revenue, user stats
- **Security monitoring** - failed login tracking

## 🎯 Usage Examples

### Create Listing with Video
1. Go to `/sell/new`
2. Upload images (up to 5)
3. Upload video (up to 50MB)
4. Set title, description, price
5. Select category
6. Publish listing

### Admin User Management
1. Access `/admin` (admin role required)
2. View recent users table
3. Change user roles via dropdown
4. Delete problematic users
5. Monitor platform statistics

### Buyer Experience
1. Browse listings at `/browse`
2. Use filters and search
3. Contact seller via messages
4. Complete purchase with Stripe
5. Leave review after transaction

## 🔒 Security Features

- **Password hashing** with bcrypt
- **Session security** with iron-session
- **Rate limiting** on login attempts
- **Account lockout** after failed attempts
- **Role-based access** control
- **CSRF protection** built-in
- **Input validation** throughout

## 🚀 Deployment

The marketplace is ready for deployment to platforms like:
- **Vercel** (recommended for Next.js)
- **Netlify**
- **Railway**
- **DigitalOcean App Platform**

Update environment variables for production and configure your domain.

## 📞 Support

For issues or questions:
1. Check the admin panel for platform stats
2. View database with `npx prisma studio`
3. Check server logs for errors
4. Ensure all environment variables are set

---

**TheWoob VIP Marketplace** - Where exclusivity meets functionality 🎩✨
