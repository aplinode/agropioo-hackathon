# Agropioo — Information Architecture

> Roles, pages, and API routes for the full product. Aligned with `Agropioo_Project_Documentation.md` (Pakistan-first AI agriculture platform) and `Agropioo Tech Stack.md` (Next.js + Neon Lakebase Postgres).

---

## Roles

| Role | Access |
|---|---|
| **Farmer** | Own farms, farm records, AI advisor, all farmer tools |
| **Admin** | User management, content/data management, analytics |

No expert role. No community feature.

---

## Pages

### Public

| Route | Purpose |
|---|---|
| `/` | Landing page *(done)* |
| `/why-agropioo` | Product story *(done)* |
| `/signup` | Create account |
| `/login` | Sign in *(done)* |
| `/forgot-password` | Request password reset |
| `/reset-password` | Set new password via token |
| `/onboarding` | First-login setup: language pick (Urdu/Punjabi/Pashto/Sindhi/Saraiki/Balochi/Hindko), profile, add first farm |

### Farmer app — `(dashboard)` route group

**Core**

| Route | Purpose |
|---|---|
| `/dashboard` | Today's advisory, weather snapshot, alerts, quick actions |
| `/farms` | Farm list |
| `/farms/new` | Add farm (location, crop, basic info) |
| `/farms/[id]` | Farm detail: crops, growth stage, health overview |
| `/farms/[id]/records` | Digital farm record log: irrigation, fertilizer, pesticide, disease, harvest |
| `/advisor` | AI Agriculture Advisor chat — text + voice, local languages |

**Feature tools** (map to feature matrix in `Agropioo_features.md`)

| Route | Feature |
|---|---|
| `/detect` | AI crop disease detection (photo upload, diagnosis history) |
| `/satellite` | Field NDVI map + time-lapse (Sentinel Hub) |
| `/weather` | Hyperlocal forecast + personalized advisories |
| `/prices` | Mandi price tracker + 7–14 day prediction, sell/hold signals |
| `/crop-recommendation` | What to plant this season |
| `/schemes` | Government scheme matcher + eligibility form |
| `/finance` | Farm P&L calculator, expenses vs projected, break-even, PDF export |
| `/pest-alerts` | Pest outbreak risk predictions |
| `/carbon` | Carbon footprint tracker + credit estimator |

**Account**

| Route | Purpose |
|---|---|
| `/notifications` | Alerts center: weather warnings, pest outbreaks, price spikes |
| `/settings` | Profile, language, notification preferences |

### Admin

| Route | Purpose |
|---|---|
| `/admin` | KPIs: users, diagnoses run, DAU |
| `/admin/users` | User management |
| `/admin/content` | Schemes DB, crop knowledge base, advisory templates |
| `/admin/analytics` | Impact metrics |

---

## API Routes

```
app/api/auth/{signup,login,forgot-password,reset-password}
app/api/farms
app/api/farms/[id]/records
app/api/advisor
app/api/detect
app/api/weather
app/api/prices
app/api/schemes
app/api/crops/recommend
app/api/notifications
app/api/admin/*
```

All DB access flows through Next.js Route Handlers → Neon Lakebase Postgres (no direct client-to-DB).

---

## Demo Build Priority

Matches the demo flow in `Agropioo_features.md`:

1. `/onboarding`
2. `/dashboard`
3. `/farms` + records
4. `/advisor`
5. `/detect`
6. `/prices`
7. `/schemes`

---

## Explicitly Out of Scope

- Expert / agronomist role
- Community forum & expert connect
- Voice-first phone call mode (IVR)
- SMS alerts
