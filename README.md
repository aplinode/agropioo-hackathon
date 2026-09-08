# Agropioo

AI-powered smart agriculture platform built for Pakistani farmers — a personal
multi-agent agriculture advisor, digital farm records, disease detection, mandi
price tracking, weather advisories, crop recommendations, pest prediction, and
profit/loss tracking, all in the farmer's own language (8 locales, with RTL).

> Pakistan-first. Designed to expand to local crops, climates, and languages
> worldwide. See [PROJECT_SUMMARY](./docs/PROJECT_SUMMARY.txt).

**Builders:** Sheikh Mohammad Ahmed (Team Lead), Mustafa Shahzad (Co-Creator) · Aplinode.

**Demo Video:** [Click Here](https://youtu.be/KzR7_XsakdQ?si=o3REP5N6hPw_Ltc1)

---

## Tech stack

| Layer | Technology |
|---|---|
| Full-stack framework | Next.js 16 (Route Handlers only — no Express) |
| Frontend | React 19 (Server Components by default) |
| Styling | Tailwind CSS v4 (brand tokens `--color-agro-*`) |
| Maps | Leaflet + React-Leaflet + Photon geocoding |
| Offline / PWA | Serwist + IndexedDB |
| Backend / API | Next.js Route Handlers (66 endpoints, 14 domains) |
| Database | Neon Lakebase Postgres + pgvector |
| Auth | bcryptjs + jose JWT (httpOnly/Secure/SameSite cookies) + OTP |
| AI orchestration | @openai/agents — 8 specialized agents |
| LLM | OpenAI (`gpt-4o-mini`) |
| RAG embeddings | Ollama `nomic-embed-text` (768-dim, local) |
| Disease detection | TensorFlow.js + HuggingFace (38 classes) |
| Image storage | Cloudinary |
| Weather | OpenWeather API |
| Email | nodemailer + SMTP |
| Validation | Zod (every route-handler input) + react-hook-form |
| Tests | Vitest (unit/integration) · Playwright (E2E) |

---

## Quick start

```bash
npm install
cp .env.example .env.local   # then fill required values
npm run dev                  # http://localhost:3000
```

### Required environment (see `.env.example`)

- `DATABASE_URL` / `DATABASE_URL_UNPOOLED` — Neon Lakebase Postgres
- `JWT_SECRET` — ≥16-char signing key
- `OPENAI_API_KEY` — advisor LLM
- `OLLAMA_HOST` + `OLLAMA_EMBED_MODEL` — local embeddings (`npm run seed:knowledge`)
- `HUGGINGFACE_API_KEY` — disease-detection model
- `CLOUDINARY_*` — scan image storage
- `OPENWEATHER_API_KEY` — weather forecasts
- `SMTP_*` + `EMAIL_FROM` — email (optional; demo mode shows OTP on-screen)
- Cron secrets for `prices/ingest`, `cron/predict-prices`, `pest-prediction`, `advisor`

### Seeding & scripts

```bash
npm run seed:knowledge   # embed 21 knowledge docs into pgvector (needs Ollama)
npm run sync:translations # upsert i18n keys for all 8 locales into Neon
npm run scrape:prices     # ingest live mandi prices from 5 gov sources
npm test                  # Vitest
```

---

## Project structure

```text
app/
├── [locale]/                  # marketing pages (/en, /ur, /pa, ...)
├── (farmer)/                  # authenticated farmer app
│   ├── (dashboard)/           # /dashboard, /farms, /advisor, /detect, /prices, ...
│   └── ...
├── api/                       # Route Handlers (14 domains)
lib/                            # 100+ modules (agents, ML, scrapers, validation)
├── advisor/                    # 8-agent orchestrator + RAG
├── crops/                      # recommendation engine + 16 soil profiles
├── prices/                     # 5-government-source scrapers + prediction
├── weather/                    # OpenWeather + AI advisory
├── pest/                       # outbreak prediction
├── detect/                     # disease detection (HuggingFace + TF.js)
└── validation/                 # Zod schemas per domain
data/advisor-knowledge/        # 21 agricultural knowledge docs
db/migrations/                 # 16 migrations (pgvector for RAG)
catalog/                       # UI strings per locale (synced to DB)
components/                    # shared UI
tests/                         # spec + acceptance tests
```

---

## Architecture notes

- **No separate backend.** Every API endpoint is a Next.js Route Handler; the client
  never touches the database directly (Client → Route Handler → Neon).
- **One shared DB client:** `lib/db.ts`. No ad-hoc clients.
- **Zod validates every route-handler input** (query params and body) before data
  reaches the database.
- **Uniform errors:** every handler returns `{ error: { code, message } }`.
- **Per-IP rate limiting** on auth routes (signup, login, forgot-password).
- **Demo mode** (`DEMO_MODE=true`): renders the OTP verification code on-screen when
  SMTP is unconfigured, so you can sign in without an email provider.

---

## Localization

- Translations live in the Neon `translations` table (admin-editable) — not hardcoded
  dictionaries.
- 8 locales: `en`, `ur`, `pa`, `ps`, `sd`, `skr`, `bal`, `hno`.
- Visible language switcher in the nav across all pages (marketing, signup, login,
  farmer app).
- Urdu and Pashto render RTL with mirrored layout; Nastaliq typography for Urdu.
- Sync catalog keys to the DB: `npm run sync:translations`.

---

## Out of scope (per constitution)

Voice input/output, carbon-credit tracking, expert
agronomist role, community forum, SMS alerts, and hardware/IoT.

---

## Docs

- [Project Documentation](./docs/Agropioo_Project_Documentation.md)
- [Tech Stack](./docs/Agropioo_Tech_Stack.md)
- [Features](./docs/Agropioo_features.md)
- [Hackathon Submission](./docs/hackathon-submission.md)
- Specs: `specs/` · ADRs: `adrs/`
