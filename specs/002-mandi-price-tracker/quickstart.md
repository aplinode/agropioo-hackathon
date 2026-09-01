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
PRICES_CRON_SECRET=your-prices-ingest-bearer-token
```

The GitHub Actions cron uses `PRICES_CRON_SECRET` to call `POST /api/prices/ingest`. It must match between `.env`, Vercel production env, and the `PRICES_CRON_SECRET` GitHub Actions secret.

---

## 2. Database Migrations, Seeding & 8-Locale Translations

Apply the Mandi Price Tracker schema migrations and populate the Neon `translations` table across all 8 supported Pakistan locales (`en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`):

```bash
# 0008 — mandi_prices + supporting tables
# 0009 — scraper_runs + mandi_holidays + mandi_prices.source_code
npm run migrate

# Seed crops, mandis, sample prices, and pre-flagged holidays
node --experimental-strip-types --env-file-if-exists=.env scripts/seed-mandi-prices.ts

# Sync all UI translation keys to the Neon database translations table
npm run sync:translations
# (Or insert/update translation rows directly via Neon MCP / Lakebase Postgres)
```

---

## 3. Running the Scraper Locally (optional, dev only)

The scraper is only ever run by GitHub Actions in production. For local debugging:

```bash
# Install Playwright Chromium once
npx playwright install --with-deps chromium

# Run against your local Next.js dev server (default port 3000)
npm run scrape:prices
# Internally:
#   node --experimental-strip-types --env-file-if-exists=.env scripts/scrape-prices/index.ts
```

The runner does not touch the network on its own; it POSTs into your local `/api/prices/ingest`, which then writes to your dev DB. So you must have `npm run dev` running in another terminal.

---

## 4. Running & Verifying Locally

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
   - **Scraper badge**: every price card should now show a small `data-source-badge` chip (e.g. `Punjab AMIS`) so farmers can see which portal reported the number.

---

## 5. Operational Runbook

- **Cron missed a day**: GitHub Actions will email the maintainers. Run the workflow manually from the Actions tab.
- **Drift suspected** (`status='drift_suspected'` in `scraper_runs`): open `lib/prices/scrapers/selectors.ts`, update the affected portal's selectors, commit, push. The next cron run will heal automatically.
- **Rate-limited a portal**: lower the source's `waitForTimeout` cap or pause the source by renaming its `source_code` in the workflow's `strategy.matrix`. Other sources keep running.
- **DB growth**: `scraper_runs` is auto-pruned to 7 days. `mandi_prices` has no TTL — historical prices feed the forecaster.

---

## 6. Automated Testing

Run Zod validation and Route Handler unit tests:

```bash
npm run test
```

Or run specific price tracker tests:

```bash
npx vitest run app/api/prices
```

The scraper has no committed live-network tests (per Constitution security rules). Validate end-to-end via the local debug run above, then let the GitHub Actions cron take over.