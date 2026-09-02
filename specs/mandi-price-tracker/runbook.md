# Mandi Scraper Operator Runbook

> For the founder and any maintainer who needs to keep the
> `feat/002-scraper` Playwright whole-Pakistan mandi scraper alive.

## What the scraper does

- Every day at 01:00 UTC, GitHub Actions (workflow
  `.github/workflows/mandi-cron.yml`) checks out the repo, installs
  Playwright Chromium, and runs `npm run scrape:prices`.
- The runner (`scripts/scrape-prices/index.ts`) opens a single
  Playwright browser and, in parallel-by-source-with-its-own-try/catch,
  pulls the latest prices from:
  - **amis_pk** — Punjab AMIS (`http://www.amis.pk/ViewPrices.aspx`)
  - **samis_pk** — Sindh SAMIS (`https://new-theme.staging-amis.com/market_price`)
  - **fmis_kp** — KP FMIS (`https://fmis.kp.gov.pk/kp_essential_commodities_price`)
  - **bmis_balochistan** — Balochistan BMIS primary
    (`https://amisbalochistan.org/prices/`) with fallback to
    `https://balochistankissan.gob.pk/pages/market-rates`
  - **pbs_spi** — PBS Weekly SPI XLSX
    (`https://www.pbs.gov.pk/price-statistics/`)
- Scraped rows are POSTed in chunks of up to 5,000 to
  `POST /api/prices/ingest` with the `PRICES_CRON_SECRET` bearer.
  The endpoint upserts into `mandi_prices` and writes an audit row
  to `scraper_runs` (7-day retention).
- The runner exits **0 if at least one source wrote rows**, **1
  otherwise**. The workflow surfaces the exit code, so a
  fully-silent failure pages a maintainer.
- After scraping, the existing predict-prices curl call still runs
  to refresh forecasts + evaluate alerts.

## How to read the health endpoint

`GET /api/prices/health` (public, no auth) returns one row per
`source_code` with the most recent `scraper_runs` row:

```json
{
  "sources": [
    {
      "source_code": "amis_pk",
      "last_run": "2026-09-01T01:14:23.000Z",
      "rows": 248,
      "status": "ok",
      "drift": "healthy"
    },
    {
      "source_code": "samis_pk",
      "last_run": "2026-09-01T01:14:25.000Z",
      "rows": 0,
      "status": "ok",
      "drift": "drift_suspected"
    }
  ]
}
```

`drift` values:
- `healthy` — today's run wrote rows.
- `weekend` — today's run wrote zero rows and the cron landed on a
  non-weekday (e.g. Sunday). Expected; not actionable.
- `no_history` — today's run wrote zero rows but the source has
  never published on a weekday. Expected for a brand-new portal;
  no action.
- `drift_suspected` — today's run wrote zero rows on a weekday AND
  this source has weekday history. **Action: investigate.**

## How to investigate drift

1. **Which source?** `drift_suspected` only on one source → the
   selectors for that portal are stale. `drift_suspected` on all
   sources → the whole cron failed (check the GitHub Actions run
   log first; usually the browser install or network).
2. **Visit the portal manually** with the URL printed in
   `scripts/scrape-prices/selectors.ts`. The portal's
   `displayName` is the human label in the SELECTORS map.
3. **Find the broken selector.** Most drift comes from a renamed
   CSS class or a moved table element. Use the browser's DevTools
   to compare the new DOM to the selectors file.
4. **Patch `scripts/scrape-prices/selectors.ts`.** No CSS strings
   should live anywhere else in the scraper — keep the single
   source of truth intact.
5. **Add a regression test** under
   `lib/prices/scrapers/selectors.test.ts` so the next refactor
   can't silently drop or rename a column.
6. **Re-trigger the workflow** with `workflow_dispatch` (see
   below) and watch the next health response.

## How to manually trigger the workflow

1. GitHub → repo → Actions tab → "Mandi Price Tracker — Nightly
   Scraper".
2. "Run workflow" → pick the branch (`feat/002-scraper-resumed`
   while the PR is open, `main` after merge) → click "Run
   workflow".
3. The job runs on the same `ubuntu-latest` runner; the output
   stream shows the runner's per-source summary, total rows
   written, and exit code.

## How to investigate a 4xx / 5xx from the ingest endpoint

- 401 → `PRICES_CRON_SECRET` secret is missing or rotated. Update
  the secret in repo settings, do not commit the value.
- 422 → Zod validation rejected a batch. The error body identifies
  the row. Most common cause: a portal started emitting a unit
  other than `per_maund_40kg`. Fix the parser in
  `scripts/scrape-prices/sources/<source>.ts`.
- 429 → rate limit (10 req/min per IP). The runner is single-shot
  per cron, so this only happens if a teammate is also
  exercising the endpoint; back off.
- 5xx → look at the server logs. If it persists past a retry, the
  issue is in `app/api/prices/ingest/route.ts`.

## Local development loop

```bash
npm ci
npx playwright install --with-deps chromium
npm run scrape:prices
```

The runner reads `APP_URL` and `PRICES_CRON_SECRET` from the
environment (see `.env.example`). It also reads
`SCRAPE_DRY_RUN=1` to skip the POST and only log what would
have been written — useful for selector changes and offline
debugging.

## When to escalate

- All five sources drift at once → portal-wide outage or
  Playwright version drift. Check the GitHub Actions run log
  first.
- The runner exits 0 with `totalRowsWritten: 0` → impossible by
  design; that is a bug, open an issue.
- The health endpoint returns 5xx → check the `scraper_runs`
  audit log for the failing source's last row and the
  application server logs.
