---
kind: build_system
name: Next.js Monorepo Build, Lint & Test Pipeline
category: build_system
scope:
    - '**'
source_files:
    - package.json
    - next.config.ts
    - vitest.config.ts
    - eslint.config.mjs
    - postcss.config.mjs
    - scripts/sync-translations.mts
---

## Build System Overview

Agropioo is a single-package Next.js 16 application (React 19) with no separate build toolchain — the entire build pipeline is driven by `npm` scripts in `package.json`, backed by Next.js's built-in bundler, TypeScript compiler, and Vitest for testing.

### Core Scripts (`package.json`)
- `dev` → `next dev` — development server
- `build` → `next build` — production build (outputs to `.next/`)
- `start` → `next start` — serve the production build
- `lint` → `eslint` — code quality via `eslint-config-next`
- `test` → `vitest run` — unit test runner
- `sync:translations` → Node script that upserts the typed `catalog/` translation matrix into Supabase using service-role credentials; idempotent full-matrix upsert keyed on `(key, locale)`

### Build Configuration
- **Next.js config** (`next.config.ts`): minimal — only enables `experimental.globalNotFound` so unmatched URLs render a custom `<html>`-wrapped 404 page (required because root layout lives under `app/[locale]/layout.tsx`).
- **TypeScript**: standard `tsconfig.json`; compilation artifacts land in `tsconfig.tsbuildinfo`.
- **Styling**: Tailwind CSS v4 via `@tailwindcss/postcss` + PostCSS (`postcss.config.mjs`).
- **Proxying**: `proxy.ts` at repo root provides local API proxying during development.

### Testing
- **Runner**: Vitest v4 configured in `vitest.config.ts`.
- **Environment**: `node` (not jsdom), appropriate since tests target `lib/` and `catalog/` modules.
- **Path alias**: `@` resolves to the repo root, matching the app's import style.
- **Test discovery**: `lib/**/*.test.ts` and `catalog/**/*.test.ts`.

### Linting
- ESLint v9 flat config (`eslint.config.mjs`) composed from `eslint-config-next/core-web-vitals` and `eslint-config-next/typescript`.
- Overrides default ignores to also skip `.next/**`, `out/**`, `build/**`, and `next-env.d.ts`.

### Translation Sync (Build-Time Artifact)
- The `scripts/sync-translations.mts` script reads the typed `catalog/` source-of-truth (English keys defined once, parallel locale dictionaries) and pushes every key×locale combination into Supabase's `translations` table. Untranslated entries are stored with `status: 'missing'` and `value: null` so coverage is measurable. Requires `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` env vars; exits non-zero if missing or if an upsert chunk fails.

### What Is NOT Present
- No Dockerfile, docker-compose, Makefile, shell build/deploy scripts, GitHub Actions / CI YAML, Vercel/VPS deployment configs, or version bump/release scripts were found. Deployment is therefore assumed to be handled externally (e.g., Vercel hosting a Next.js project) rather than via repository-managed artifacts.