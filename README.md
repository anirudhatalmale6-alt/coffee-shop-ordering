# Coffee Shop - QR Code Ordering System

A mobile-first micro website for coffee shop orders with prepaid pickup.

## Features

- **Customer Website**: Mobile-optimized menu browsing and ordering
- **Per-cup name customization**: Like Starbucks - customers can write different names on each cup
- **Guest checkout**: No account required (name + mobile)
- **Optional OTP login**: For returning customers
- **UPI payments**: Via Razorpay
- **Same-day pickup slots**: 15-minute intervals, auto-blocking when full
- **Counter display**: Real-time order view for staff
- **Admin dashboard**: Manage menu, locations, time slots, and orders

## Tech Stack

- **Frontend**: Next.js 14 + React + Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: PostgreSQL + Prisma ORM
- **Payments**: Razorpay
- **Auth**: JWT (cookies)

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url>
cd coffee-shop
npm install
```

### 2. Set up environment

```bash
cp .env.example .env
```

Edit `.env` with your values:
- `DATABASE_URL`: Your PostgreSQL connection string
- `JWT_SECRET`: A secure random string
- `RAZORPAY_KEY_ID`: Your Razorpay key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay secret

### 3. Set up database

```bash
npm run db:push    # Create tables
npm run db:seed    # Add sample data
```

### 4. Run locally

```bash
npm run dev
```

Visit:
- Customer site: http://localhost:3000
- Admin login: http://localhost:3000/admin/login
- Counter display: http://localhost:3000/counter

**Default admin credentials**: admin / admin123

## Deployment (Vercel + Supabase)

### Database (Supabase - Free Tier)

1. Create account at https://supabase.com
2. Create new project
3. Go to Settings > Database
4. Copy the "Connection string" (URI)
5. Replace `[YOUR-PASSWORD]` with your database password

### Payments (Razorpay)

1. Create account at https://razorpay.com
2. Go to Settings > API Keys
3. Generate and copy Key ID and Secret
4. For testing, use Test mode keys

### Hosting (Vercel - Free)

1. Push code to GitHub
2. Import project in Vercel
3. Add environment variables:
   - `DATABASE_URL` (from Supabase)
   - `JWT_SECRET` (generate a secure random string)
   - `RAZORPAY_KEY_ID`
   - `RAZORPAY_KEY_SECRET`
4. Deploy!

After deployment:
```bash
# Run migrations on production database
npx prisma db push
# Seed sample data (optional)
npm run db:seed
```

## Pages

| Page | URL | Description |
|------|-----|-------------|
| Menu | `/` | Customer ordering page |
| Order Status | `/order/[orderNumber]` | Order tracking |
| Counter | `/counter` | Staff order display |
| Admin Login | `/admin/login` | Admin authentication |
| Admin Orders | `/admin` | Order management |
| Admin Menu | `/admin/menu` | Menu management |
| Admin Locations | `/admin/locations` | Pickup locations |
| Admin Time Slots | `/admin/timeslots` | Slot configuration |

## Monthly Costs

| Service | Cost |
|---------|------|
| Vercel (Frontend) | Free |
| Supabase (Database) | Free (500MB) |
| Razorpay | 2% per transaction |
| **Total** | ~$0/month + payment fees |

## Customization

### Shop Name
Edit `src/app/layout.tsx` and `src/app/page.tsx`

### Colors
Edit CSS variables in `src/app/globals.css`:
```css
:root {
  --primary: #6B4423;
  --primary-light: #8B6914;
  --accent: #D4A574;
  ...
}
```

### Time Slots
Use Admin Dashboard > Time Slots to configure:
- Operating hours
- Slot duration (10/15/20/30/60 min)
- Max orders per slot

## Support

For issues, contact the developer.
