---
kind: configuration_system
name: Environment-Based Configuration via Next.js process.env and .env Files
category: configuration_system
scope:
    - '**'
source_files:
    - .env.example
    - lib/supabase.ts
    - lib/mailer.ts
    - lib/auth/pass.ts
    - lib/i18n/config.ts
    - next.config.ts
    - proxy.ts
    - package.json
---

## What system/approach is used

The repository uses a plain **environment-variable configuration system** built on Node.js `process.env`, with `.env` / `.env.example` files as the source of truth for runtime secrets and feature toggles. There is no dedicated config library (no dotenv parsing, no YAML/TOML/JSON config loaders, no centralized `config/` directory). Configuration values are consumed directly from `process.env` at module load time in the modules that need them.

## Key files and packages

- `.env.example` — documents every required environment variable: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `JWT_SECRET`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASSWORD`, `EMAIL_FROM`, `DEMO_MODE`. The file also contains inline comments explaining each variable's purpose and security constraints (e.g., service role key must never be exposed to the browser).
- `lib/supabase.ts` — central Supabase client factory. Defines a local `requireEnv(name)` helper that throws if an env var is missing, then lazily creates both an anonymous client (`getSupabase`) and an admin client (`getSupabaseAdmin`) using `SUPABASE_URL` + either `SUPABASE_ANON_KEY` or `SUPABASE_SERVICE_ROLE_KEY`. Both clients are memoized per process lifetime.
- `lib/mailer.ts` — reads SMTP settings from `process.env.SMTP_*` and `EMAIL_FROM`; conditionally enables a demo mode when SMTP is unconfigured AND `DEMO_MODE=true`.
- `lib/auth/pass.ts` — reads `JWT_SECRET` for HS256 signing and sets cookie `secure` flag based on `NODE_ENV === 'production'`.
- `next.config.ts` — Next.js runtime configuration; currently only enables the experimental `globalNotFound` flag. No env-var reading here.
- `proxy.ts` — middleware that rewrites non-locale URLs to `/en` using locale registry from `lib/i18n/config.ts`; its own behavior is controlled by the `matcher` regex which excludes API, static assets, and farmer-app routes.
- `package.json` scripts — `sync:translations` passes `.env` into a Node script via `--env-file-if-exists=.env`, demonstrating how server-side scripts consume env vars.
- `opencode.json` — tooling configuration for the OpenCode AI assistant (permissions), unrelated to application runtime config.

## Architecture and conventions

1. **Single-source env schema**: `.env.example` is the canonical list of all expected variables. New features should add entries there so developers know what to set locally.
2. **Fail-fast validation**: `lib/supabase.ts` implements a `requireEnv(name)` helper that throws a descriptive error when a required variable is absent. This pattern enforces early startup failures rather than silent misconfiguration.
3. **Client memoization**: Supabase clients are created once per process and cached in module-level variables (`client`, `adminClient`), reused on subsequent calls. This avoids re-reading env vars and re-instantiating connections.
4. **Feature toggle via env**: `DEMO_MODE` acts as a boolean feature flag (`process.env.DEMO_MODE === 'true'`) that gates demo-only behavior (verification-code banner, mailer fallback) — explicitly documented as never to be set in production.
5. **Production gating**: Cookie security (`secure`) is tied to `NODE_ENV === 'production'`, letting the same codebase behave differently across environments without separate builds.
6. **No build-time config**: Unlike some Next.js apps that use `NEXT_PUBLIC_*` variables, this repo does not appear to expose any env vars to the browser; all configuration lives on the server side (API routes, lib modules, scripts).
7. **i18n as compile-time config**: Language support is configured via the `LOCALES` constant and `LOCALE_REGISTRY` in `lib/i18n/config.ts` — a TypeScript constant array rather than env-driven configuration. Adding a language requires editing this registry, not setting an env var.

## Conventions and constraints

- **Required variables**: `SUPABASE_URL` and `SUPABASE_ANON_KEY` are mandatory for the app to start; their absence causes a thrown error during client instantiation.
- **Service role key isolation**: `SUPABASE_SERVICE_ROLE_KEY` is documented as server-side only (used by `scripts/sync-translations.mts` and `getSupabaseAdmin()`) and must never be exposed to the browser — enforced by keeping it out of client-side code paths.
- **JWT secret minimum length**: `.env.example` specifies a minimum of 16 characters and provides a one-liner to generate one via `crypto.randomBytes(32)`.
- **Demo mode is opt-in and dangerous**: `DEMO_MODE=true` is gated behind SMTP being unconfigured and is explicitly marked as never to be set in production.
- **Mailer graceful degradation**: When SMTP credentials are missing but `DEMO_MODE=true`, emails are silently dropped and the verification code is echoed back instead of failing — a deliberate development convenience.
- **Locale routing is URL-based, not env-based**: The proxy middleware treats the first URL segment as the locale slug; English has no slug (bare URLs default to English). This is a hard-coded convention in `lib/i18n/config.ts`, not configurable at runtime.
- **Next.js experimental flags**: `globalNotFound` is enabled in `next.config.ts` to support root-level `<html>` rendering for unmatched routes under `[locale]` routing.