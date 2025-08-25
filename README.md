# TheWoob — Local Marketplace (Next.js + Tailwind + Prisma + Stripe Connect)

A polished, **brand-ready** marketplace you can run locally:

- ✨ Tailwind dark UI and branding
- � **Enhanced Authentication** (passwordless + password-based with security features)
- 🛒 Listings (create/browse/detail) with search & filtering
- 💳 Stripe Elements checkout
- 💸 Your cut via Connect destination charges (`application_fee_amount`)
- 🔗 Stripe Express onboarding
- 📦 Orders + webhook reconciliation
- 📊 Seller dashboard (gross/fee/net)
- 💬 Real-time messaging between buyers/sellers
- 📧 Email verification & password reset
- 🔒 Account security (rate limiting, account lockout)

## 🔐 Authentication Features

**Enhanced Login System:**
- Passwordless authentication (backwards compatible)
- Password-based authentication with bcrypt hashing
- Email verification for new accounts
- Password reset functionality
- Rate limiting and account lockout protection
- Session management with enhanced security

**Available Auth Pages:**
- `/signin` - Original simple signin (still works)
- `/enhanced-signin` - New enhanced signin with password options
- `/account` - Account settings and security management
- `/auth/verify?token=...` - Email verification
- `/auth/reset?token=...` - Password reset


## � Listing Status Lifecycle

- **ACTIVE**: Visible to all users, searchable and buyable.
- **SOLD**: Marked as sold, hidden from default search. Can be re-activated by owner/admin.
- **HIDDEN**: Hidden from public, visible only to owner/admin. Can be re-activated.
- **DELETED**: Soft-deleted, excluded from all user-facing queries except for admin direct fetch. Can be hard-deleted by admin.

### Re-activating Listings
- Owners or admins can change status from HIDDEN/SOLD back to ACTIVE via dashboard or API.

### Soft Delete
- Listings set to DELETED are excluded from all search/browse queries and dashboards.
- Admins can hard delete via the admin UI or API, which permanently erases the row and associated media.
- Listings in DELETED for >90 days are purged automatically by a daily maintenance job (`scripts/purge-old-deleted-listings.js`).

### SQL View
- `public.active_listings_view` selects all non-DELETED listings for raw SQL/reporting.


**Windows (PowerShell):**
```powershell
.\launch.ps1
```

**Windows (Command Prompt):**
```cmd
launch.bat
```

**Mac/Linux:**
```bash
chmod +x launch.sh
./launch.sh
```

**Cross-platform (Node.js):**
```bash
node launcher.js
```

These launchers will automatically:
- ✅ Check Node.js installation
- 📦 Install dependencies
- 🔧 Set up environment file
- 🗄️ Initialize database
- 🌱 Seed sample data
- 🚀 Start development server

## Manual Setup

If you prefer manual setup:

```bash
npm install
cp .env.example .env   # add Stripe test keys + SESSION_PASSWORD
npx prisma migrate dev --name init
npx prisma db seed
npm run dev
```

## Getting Started

Open http://localhost:3000

- **/signin** → dev email login
- **/onboard** → create/connect Stripe Express
- **/sell/new** → create a listing
- **/listings/:id** → **/checkout/:id** to pay (use test card 4242 4242 4242 4242)
- Add a Stripe webhook to `POST /api/stripe/webhook` and set `STRIPE_WEBHOOK_SECRET`

## Features

### 🔍 Search & Filtering
- Real-time search across titles and descriptions
- Category filtering with predefined categories
- Price range filtering
- Clean, clear filters interface

### 🎨 Enhanced UI/UX
- Hover animations and smooth transitions
- Loading states and error handling
- Better form validation with helpful messages
- Professional typography and spacing

### 🛡️ Improved Validation
- Comprehensive API validation
- Type-safe components with TypeScript interfaces
- Better error messages for users
- URL validation for image uploads

## Environment Variables

Required in `.env` file:
- `STRIPE_SECRET_KEY` - Your Stripe secret key (test mode)
- `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` - Your Stripe publishable key (test mode)
- `SESSION_PASSWORD` - Random string (32+ characters)
- `FEE_PERCENT` - Your platform fee (default: 0.10 = 10%)
- `STRIPE_WEBHOOK_SECRET` - Webhook secret from Stripe dashboard

## Notes
- `FEE_PERCENT` sets your platform cut (default 0.10).
- SQLite for local; switch to Postgres when deploying.
- Replace demo auth with NextAuth/Clerk when ready.

## Test Data

The launcher includes sample listings for testing:
- Electronics, furniture, books, and more
- Various price ranges
- Different categories for filter testing
