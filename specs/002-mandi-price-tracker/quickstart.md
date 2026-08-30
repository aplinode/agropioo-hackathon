# Quickstart Guide: Mandi Price Tracker & Predictor

This guide covers setting up, running, testing, and verifying Feature 002: Mandi Price Tracker & Predictor.

---

## 1. Environment Setup

Ensure your local `.env` file contains the following keys (see `.env.example`):

```env
DATABASE_URL=postgres://...
CRON_SECRET=your-secret-cron-token
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@example.com
SMTP_PASS=your-app-password
SMTP_FROM=AgriPioo Notifications <no-reply@agropioo.pk>
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

---

## 2. Database Migrations, Seeding & 8-Locale Translations

Apply the Mandi Price Tracker schema migration and populate the Neon `translations` table across all 8 supported Pakistan locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`):

```bash
# Seed initial crops, Pakistan mandis, and historical price sample data
node --experimental-strip-types --env-file-if-exists=.env scripts/seed-mandi-prices.ts

# Sync all UI translation keys to the Neon database translations table
npm run sync:translations
# (Or insert/update translation rows directly via Neon MCP / Lakebase Postgres)
```

---

## 3. Running & Verifying Locally

1. Start the Next.js development server:
   ```bash
   npm run dev
   ```
2. Open [http://localhost:3000/prices](http://localhost:3000/prices) in your browser.
3. Test key user flows:
   - **P1 Market Prices**: View automatically loaded prices for your farm's district or default provincial hub.
   - **P2 Comparison & Trends**: Compare side-by-side market prices, view 14-day predictions chart with confidence bands, and check Sell/Hold recommendations.
   - **P3 Target Price Alerts**: Create a price alert for wheat at e.g. PKR 4,000/Maund; toggle active/paused; delete alert.
   - **Global Search**: Search for any district/mandi across Pakistan using the top search bar.
   - **Dashboard Integration**: Check [http://localhost:3000/dashboard](http://localhost:3000/dashboard) to verify the top 3 tracked crops widget with 7-day mini-sparklines.

---

## 4. Automated Testing

Run Zod validation and Route Handler unit tests:

```bash
npm run test
```

Or run specific price tracker tests:

```bash
npx vitest run app/api/prices
```
