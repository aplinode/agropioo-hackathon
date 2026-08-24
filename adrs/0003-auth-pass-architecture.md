# ADR 0003 — Authentication pass architecture

Date: 2026-08-24 · Status: accepted · Implements `specs/authentication/plan.md` K1–K7.

## Context

Four auth surfaces needed a real backend: signup + email verification, password-only
login with 7-day sessions, and a three-step password recovery. Constitution pins
Supabase as Postgres-only, Route Handlers as the API layer, jose/bcryptjs/nodemailer/zod
as the chosen libraries. Founder amendment: user accounts table named `users`
(plan's `accounts` renamed before first apply).

## Decision

1. **State-backed JWTs** (K1): every pass is an HS256 jose token (`sub`, `email`,
   `typ` ∈ {verify, reset, session}, `jti`, `exp`); its `jti` owns a Postgres row
   (`pass_states` / `sessions`) carrying mutable truth — consumed, dead, reset stage,
   revocation. Single-use passes, cumulative wrong-attempt caps, logout-kill and
   reset-kills-all-sessions all fall out of row state.
2. **Three httpOnly cookies** `agro_verify` / `agro_reset` / `agro_session`, SameSite=Lax,
   Secure in prod (K2). Wrong-type rejection = "endpoint reads only its own cookie".
3. **Reset passes carry email only**; `account_id` binds onto the pass_states row at
   code verification (K3), so unknown-email responses stay byte-identical.
4. **Codes stored as SHA-256 hex**, last-code-wins via void-on-issue (K4); per-code
   5-wrong cap plus per-pass 10-cumulative cap (K5).
5. **Guards live in layouts + handler choke points** (K6). Two build-specific notes:
   - Every guarded segment sets `export const dynamic = "force-dynamic"` and the pass
     reader awaits `connection()` (from `next/server`) before touching cookies, so a
     prerendered static shell can never bypass auth.
   - This Next.js build swallows server-side `redirect()` on locale-REWRITTEN routes
     (proxy.ts rewrites `/login` → `/en/login`; the thrown NEXT_REDIRECT gets rendered
     by a RedirectErrorBoundary as a 200 page instead of an HTTP redirect).
     `/login` and `/signup` therefore bounce members via a DB-validated check plus a
     client `<MemberBounce>`; non-proxied routes (`/verify`, `/forgot-password`,
     `/reset-password`, dashboard group) use plain server redirects, which work there.
   - proxy.ts matcher excludes farmer/auth app paths (`verify`, `weather`, `onboarding`
     added) so they are never locale-rewritten into the `[...rest]` catch-all.
6. **In-memory fixed-window rate limiter**, dual-dimension per-IP and per-account/email
   (K7) with windows pinned in `lib/auth/rate-limit.ts`.

## Consequences

- Rate-limit state resets on restart and does not span instances — acceptable for the
  single-instance demo; Redis is the known upgrade path.
- Enumeration resistance holds by construction: dummy-hash bcrypt compare on unknown
  emails, byte-identical forgot-password bodies (demoCode attaches only under the FR17
  gate, which cannot hold once SMTP is configured).
- SMTP delivery failures degrade to the neutral retry message; codes never render
  unless SMTP is unconfigured AND `DEMO_MODE=true`.
