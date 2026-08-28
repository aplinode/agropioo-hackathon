# Plan — Authentication

> Status: DRAFT awaiting founder sign-off. Implements `spec.md` in this folder.
> Stack constraints honored: Next.js 16 App Router, Route Handlers as the API layer,
> Neon Lakebase Postgres via the shared `lib/db.ts` client, uniform
> `{ error: { code, message } }` shape, Zod at every boundary, no new dependencies
> outside the constitution's chosen-libraries table.

## Approach in one paragraph

Every pass is a **state-backed JWT**: a jose-signed token whose `jti` has a row in
Postgres that carries the mutable truth (consumed? dead? code-verified stage? revoked?).
That one choice buys everything the spec demands from signed tokens alone: single-use
consumption, cumulative wrong-attempt caps across resends, logout that kills a copied
cookie, reset-verified gating, and multi-device sessions. Three httpOnly cookies
(`agro_verify`, `agro_reset`, `agro_session`) map 1:1 to the three pass types, so
wrong-type rejection falls out of "the endpoint reads only its own cookie and its row's
kind must match". Codes are stored as SHA-256 hashes with void-on-issue for last-code-wins.
Route protection lives in server layouts and a shared handler guard (not `proxy.ts`) —
one choke point per side: `(dashboard)` layout redirects guests to `/login`; auth layouts
redirect the signed-in to `/dashboard`; every data API calls `requireSession()`.
Forms keep their current markup but move to react-hook-form + zodResolver sharing the
same Zod schemas the handlers re-validate with. The demo OTP component becomes a real
standalone `/verify` route gated by the verify/reset pass cookie.

## Key decisions & trade-offs

| # | Decision | Chosen | Alternatives rejected (why) |
|---|---|---|---|
| K1 | Pass revocation model | **State-backed JWTs**: JWT carries `jti` + type + claims; Postgres rows (`pass_states`, `sessions`) hold mutable state; every check = verify signature → read row | Pure-stateless JWTs (cannot do FR9 replay rejection, FR21 logout-kill, FR14 cumulative attempts, FR26 kill-all-sessions); opaque random tokens (re-invents signing we get free from jose) |
| K2 | Transport | **Three named cookies** `agro_verify` / `agro_reset` / `agro_session` — all httpOnly, Secure in prod, SameSite=Lax, path `/` | One multiplexed cookie (endpoint must parse+branch → wrong-type mistakes likelier); localStorage/sessionStorage (forbidden by FR6) |
| K3 | Reset-pass binding | Reset JWT carries **email only** (+jti/type/exp); `account_id` is written onto its `pass_states` row at code verification; set-password requires `stage='code_verified'` AND bound account | Putting account id in the reset JWT (leaks existence pre-verification, violates FR6); separate second cookie for verified-reset (two cookies to keep in sync for no gain) |
| K4 | Code storage & lookup | Codes hashed **SHA-256** (no salt needed — 10^6 space, high-entropy random); lookup by (`purpose`, normalized `email`); issue marks all prior unconsumed codes for that pair `voided_at=now()` (**last-code-wins**) | Storing plaintext codes (DB dump leaks live codes); per-account token-version counters (can't express per-code 5-attempt cap cleanly) |
| K5 | Wrong-attempt accounting | Per-code `wrong_count` (≥5 → code `dead`); per-pass `pass_states.wrong_total` (≥10 → pass `dead_at`) incremented on every failed check; both checked before acceptance | Attempts only on the JWT itself (immutable — can't count); attempts only per-code (cumulative-across-resends rule FR14 impossible) |
| K6 | Where guards live | **Server Components layouts + handler guard**: `(farmer)/(dashboard)/layout.tsx` calls `requireSessionPage()` → `redirect('/login')`; auth layouts call the inverse; every protected API calls `requireSession()` returning 401 shape | Checks in `proxy.ts` (edge context, no DB reach for account-exists check FR27, duplicates truth); per-page discretion (explicitly forbidden by FR27) |
| K7 | Rate limiting | In-house **fixed-window counter keyed independently by IP and by account/email**, in-process Map, windows pinned below; standard error shape on breach | `rate-limiter-flexible` etc. (new dep needs approval; overkill for single-instance demo); IP-only (CGNAT lockout, FR30 rationale); DB-backed counters (a hammering writes storms into the database) |
| K8 | Enumeration resistance mechanics | On unknown email at login: run `bcrypt.compare` against a **fixed dummy hash** anyway, then return the same generic error — comparable timing by construction; forgot-password issues a real (useless) pass + generic response always (FR10/FR23) | Sleep-jitter hacks (fragile, still leaky); differing messages (forbidden) |
| K9 | Duplicate signup / first-write-wins | `INSERT … ON CONFLICT (lower(email)) DO NOTHING` → if no row inserted, SELECT the pending row and re-issue verification using **stored** values; concurrent races resolve to the one inserted row | Upsert-with-overwrite (violates FR2); application-level check-then-insert (TOCTOU race) |
| K10 | Shared OTP screen | New standalone route **`/verify`** (server page reads pass cookie → renders `<OtpVerify>` client component with context props); flows cross requests, stale-tab rule enforced server-side | Keeping OTP as in-form client state (login-form's Flow A dies anyway; page refresh loses pass-less state machine; spec FR7 requires pass-gated rendering context) |
| K11 | Forms | Migrate existing forms to **react-hook-form + zodResolver** sharing `lib/validation/auth.ts` schemas with handlers; markup/inline-error UX preserved | Keep hand-rolled FormData validation twice (client drifts from server — exactly what FR1 forbids); ship forms to server actions (constitution: Route Handlers only) |
| K12 | Testing | Vitest (already configured, node env): Zod schemas, pass mint/verify round-trips incl. expiry/wrong-type/tamper, rate-limiter windows, pure code-lifecycle logic extracted to `lib/auth/logic.ts`; UI walked manually per AC checklist | Handler-only testing via HTTP (needs running server in CI — slow); jsdom form tests (low value vs markup-preserving refactor) |

## Library parameters (fixed here per spec header)

- **jose** HS256, `JWT_SECRET` from env; payload claims: `sub` (account id or email for reset), `email`, `typ` ∈ {verify, reset, session}, `jti`, `iat`, `exp`. Clock skew leeway 30 s. Verify pass TTL 1 h · reset pass TTL 1 h · session pass TTL 7 d (all fixed — no remember-me variants, FR20/FR22).
- **bcryptjs** cost factor 10; dummy-hash compare for unknown accounts (K8).
- **nodemailer** singleton transporter in `lib/mailer.ts`; if any of `SMTP_HOST/PORT/USER/PASSWORD/EMAIL_FROM` missing → transporter reports unconfigured; sending allowed only when `DEMO_MODE !== 'true' || smtpConfigured` logic per FR17 (demo banner shows code ONLY when SMTP unconfigured AND `DEMO_MODE=true`).
- **zod** schemas in `lib/validation/auth.ts`: `signupSchema`, `loginSchema`, `forgotSchema`, `codeSchema` (exactly 6 digits string), `resetPasswordSchema`. Email transform: trim + lowercase everywhere (edge rule).

## Database schema — `db/migrations/0002_auth.sql`

```sql
create table accounts (
  id            uuid primary key default gen_random_uuid(),
  email         text not null,
  full_name     text not null,
  phone         text,
  password_hash text not null,
  email_verified boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create unique index accounts_email_lower_idx on accounts (lower(email));

create table pass_states (
  jti          uuid primary key,           -- = JWT jti
  kind         text not null check (kind in ('verify','reset')),
  email        text not null,              -- normalized
  account_id   uuid references accounts(id),  -- null until reset binds (K3)
  stage        text not null default 'pending' check (stage in ('pending','code_verified')),
  wrong_total  integer not null default 0,
  consumed_at  timestamptz,
  dead_at      timestamptz,
  expires_at   timestamptz not null,
  created_at   timestamptz not null default now()
);

create table verification_codes (
  id           uuid primary key default gen_random_uuid(),
  purpose      text not null check (purpose in ('verify','reset')),  -- FR15 isolation
  email        text not null,
  account_id   uuid references accounts(id),
  code_hash    text not null,             -- sha256 hex (K4)
  wrong_count  integer not null default 0,
  consumed_at  timestamptz,
  dead_at      timestamptz,               -- 5 wrong entries (FR14)
  voided_at    timestamptz,               -- superseded by newer code (FR13)
  expires_at   timestamptz not null,      -- issued_at + 10 min (server clock)
  created_at   timestamptz not null default now()
);
create index codes_lookup_idx on verification_codes (purpose, email, created_at desc);

create table sessions (
  id          uuid primary key,            -- = session JWT jti
  account_id  uuid not null references accounts(id),
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null,
  revoked_at  timestamptz                  -- logout sets this (FR21)
);
create index sessions_account_idx on sessions (account_id);
```

No RLS needed yet (all access flows through Route Handlers; tables are reached only
server-side). Sessions survive restarts because they're rows.

## API routes (all under `app/api/auth/`, all POST unless noted)

Uniform responses: success = JSON body relevant to caller; failure =
`{ error: { code, message } }` with status. Error codes pinned:
`validation_error` (400) · `unauthorized` (401) · `conflict_registered` (409, the ONE
explicit duplicate case FR2 allows) · `rate_limited` (429) · `server_error` (500).

| Route | Pass required | Body (Zod) | Behaviour pins |
|---|---|---|---|
| `/api/auth/signup` | none | signupSchema | First-write-wins (K9). VERIFIED duplicate → 409 explicit message. UNVERIFIED duplicate/new → create-or-reuse account, issue code + verify pass, send email (or demo reveal), respond `{ ok: true }` |
| `/api/auth/login` | none | loginSchema | Unknown email → bcrypt-vs-dummy-hash (K8) → same generic error. Wrong pw → same. Unverified + correct → clear leftovers, issue fresh verify pass, respond `{ redirect: '/verify' }`. Verified → create session row + session cookie, clear verify/reset cookies, respond `{ redirect: '/onboarding' \| '/dashboard' }` |
| `/api/auth/logout` | session | – | Set `revoked_at`, clear cookie. Other devices' rows untouched (FR21) |
| `/api/auth/signup/verify` | verify | codeSchema | Email-match (JWT email vs code row), expiry/dead/void checks, attempt counters, consume BOTH, mark account verified (idempotent race-safe `UPDATE … WHERE NOT email_verified`), consume pass. Respond `{ ok: true }` |
| `/api/auth/signup/resend` | verify | – | 60 s cooldown since latest code of this purpose+email (server-side), last-code-wins voiding, pass.wrong_total < 10 else pass dies like expiry (FR14) |
| `/api/auth/forgot-password` | none | forgotSchema | Byte-identical generic response ALWAYS. Known email → code emailed; unknown → nothing sent. Both → reset pass cookie carrying email only (FR10) |
| `/api/auth/reset/verify` | reset | codeSchema | Same machinery as signup/verify but purpose='reset'; on success binds `account_id` onto pass row + flips `stage='code_verified'` (K3) |
| `/api/auth/reset/resend` | reset | – | Mirror of signup/resend for reset purpose |
| `/api/auth/reset/password` | reset @ stage code_verified | resetPasswordSchema | Reject otherwise → eject to `/forgot-password` (FR10). Sets hash, marks unverified→verified (idempotent, FR26), voids all reset codes/passes, **deletes all session rows** of the account. No auto-login |

Rate-limit windows (K7, pinned): signup `5/h/IP` + `5/h/email` · login `10/15min/IP`
+ `8/15min/email` (failures counted per-account on every miss) · forgot-password
`3/h/IP` + `3/h/email` · resend `5/h/pass` · code checks `20/h/IP` + `30/h/pass`.
Breach → 429 neutral "Too many attempts — please try again later." (no dimension named).

## File map (new/edited)

```
lib/db.ts                                  EXISTS (shared client — reused as-is)
lib/http.ts                                NEW  errorResponse(code,message,status) + json helpers
lib/validation/auth.ts                     NEW  all Zod schemas + email-normalize transform
lib/auth/logic.ts                          NEW  PURE fns (vitest target): code lifecycle decisions,
                                                attempt-cap evaluation, redirect decision for login,
                                                maskEmail moved here from otp-verify
lib/auth/pass.ts                           NEW  jose mint/verify per type; cookie name/TTL map;
                                                readPass(kind) from next/headers cookies
lib/auth/guards.ts                         NEW  requireSessionPage() → redirect('/login');
                                                inverse for auth pages → redirect('/dashboard');
                                                requireSession() for handlers → 401 shape
lib/auth/rate-limit.ts                     NEW  fixed-window dual-key limiter (in-memory Map)
lib/mailer.ts                              NEW  nodemailer singleton; sendCode(purpose,email,code)
                                                with FR17 DEMO gate; returns { delivered, demoCode? }
app/api/auth/signup/route.ts               NEW
app/api/auth/login/route.ts                NEW
app/api/auth/logout/route.ts               NEW
app/api/auth/signup/verify/route.ts        NEW
app/api/auth/signup/resend/route.ts        NEW
app/api/auth/forgot-password/route.ts      NEW
app/api/auth/reset/verify/route.ts         NEW
app/api/auth/reset/resend/route.ts         NEW
app/api/auth/reset/password/route.ts       NEW
db/migrations/0002_auth.sql                NEW  schema above
app/(farmer)/verify/page.tsx               NEW  shared OTP ROUTE (server: pass-gate + context)
app/(farmer)/verify/verify-screen.tsx      NEW  thin client wrapper around components/auth/otp-verify
components/auth/otp-verify.tsx             EDIT cooldown 30→60 s; drop hardcoded demoCode;
                                                submit/resend call real APIs via props callbacks;
                                                demo banner renders ONLY prop-driven demoCode
app/(site)/[locale]/login/login-form.tsx   EDIT remove OTP Flow-A branch + remember-me checkbox
                                                (spec Reconciliation #2); rhf+zod; call /api/auth/login;
                                                follow returned { redirect }
app/(site)/[locale]/signup/signup-form.tsx EDIT rhf+zod; success → router.replace('/verify');
                                                render explicit registered-message block on 409
app/(farmer)/forgot-password/*             EDIT step 1 posts real API → navigate to /verify
                                                (?context=reset); generic copy byte-stable
app/(farmer)/reset-password/*              EDIT page server-gates on reset@verified pass (eject
                                                otherwise); form posts /api/auth/reset/password;
                                                success screen links Sign in (no auto-login)
app/(farmer)/(dashboard)/layout.tsx        EDIT top: await requireSessionPage()
app/(farmer)/forgot-password/layout.tsx    NEW  signed-out-only guard (FR23/FR28)
app/(farmer)/reset-password/layout.tsx     NEW  same guard
app/(site)/[locale]/login/page.tsx         EDIT signed-out-only guard
app/(site)/[locale]/signup/page.tsx        EDIT same
.env.example                               EDIT add DEMO_MODE= (comment: demo code banner gate)
specs/otp-verification/spec.md             EDIT Reconciliation #1 (Flow A removed, 60 s, numbers)
specs/forgot-password/spec.md              EDIT Reconciliation #3 framing note
lib/auth/*.test.ts                         NEW  schemas, passes, limiter, logic suites
adrs/0003-auth-pass-architecture.md        NEW  K1–K7 record (stateful JWTs, guard placement,
                                                in-memory limiter limits)
```

## Behavior notes the plan pins down

- **Guard truth order** (FR27): cookie present → signature valid (jose) → `typ` matches
  the door → row lookup: not consumed, not dead, `expires_at > now()` (session: also
  `revoked_at IS NULL`) → account still exists. ANY failure ⇒ identical outcome
  (page: redirect `/login`; API: 401 `unauthorized`). Logs may say why; responses never do.
- **Login redirect decision** is computed server-side and returned in JSON — first-time
  detection = zero farm rows later (farms feature lands); until farms exist, every fresh
  login returns `/onboarding` when the account has never completed onboarding flag…
  simplified for this build: return `/onboarding` (demo app pages are placeholders) —
  flip to `/dashboard` once onboarding completion exists. Pinned now to avoid guessing later.
- **Stale tab** (second tab submits after first consumed the pass): pass row already
  `consumed_at` → 401 → OtpVerify ejection path → clean bounce to `/login`. No crash, no hint.
- **Resend cooldown** measured against `created_at` of the newest non-voided code for
  (purpose, email) — server-side only authority; UI countdown is cosmetic mirroring.
- **DEMO banner** data path: sendCode returns `demoCode` only when
  `!smtpConfigured && process.env.DEMO_MODE === 'true'`; APIs attach it to the JSON
  response; `/verify` renders it inside the clearly-labelled banner. Any other config →
  field absent → nothing rendered anywhere (FR17).
- **Email normalization**: zod `.transform(trim→lowercase)` runs before every comparison
  AND before storage; unique index is on `lower(email)` so even direct SQL can't fork states.
- **Idempotent verification races** (double-submit): verify does
  `UPDATE accounts SET email_verified=true WHERE id=$1 AND NOT email_verified` then treats
  both rowCount outcomes as success — second tab also lands on success state, no dupes.
- **Logout** clears cookie in the same response that revokes the row; auth-page guards
  see the user gone immediately.
- **Copy centralization**: all new user-facing strings live in `lib/auth/copy.ts`
  (single module, English) so DB-driven translation sync can absorb them later (FR12-style
  readiness without shipping translations — out of scope per spec).

## Build order (tasks follow after plan approval)

1. Deps install (bcryptjs, jose, nodemailer, zod, react-hook-form, @hookform/resolvers —
   all pre-approved) + migration 0002 applied + commit.
2. `lib/http.ts`, `lib/validation/auth.ts` + schema tests.
3. `lib/auth/logic.ts` pure functions + tests.
4. `lib/auth/pass.ts` (mint/verify/cookies) + tamper/expiry/wrong-type tests.
5. `lib/auth/rate-limit.ts` + window tests; `lib/mailer.ts` + FR17 gate.
6. Signup + login + logout routes wired to guards; handler smoke tests via direct invocation.
7. verify/resend + forgot/reset routes.
8. Page wiring: guards into layouts; `/verify` route; forms migrated (rhf+zod);
   login Flow-A/remember-me removal; reset gating.
9. Spec reconciliation edits + `.env.example` + ADR.
10. Full AC run-through (curl matrix incl. forged/expired/wrong-type passes; two-device
    session test; simulated 7-day expiry), then `npm run lint && npm run test && npm run build`.

Commits stay atomic per task-group; feature branch `feat/authentication-backend`,
PR-reviewed by founder before merge.

## Risks

- **In-memory rate limiter resets on redeploy/restart and doesn't span instances** —
  acceptable for single-instance demo; Redis upgrade noted in ADR as the known next step.
- **CGNAT tuning**: IP windows deliberately loose (login 10/15 min); per-account windows
  carry the brute-force burden. Watch false positives during demo from one network.
- **SMTP deliverability during judging** (spam folders): demo-banner fallback covers the
  walkthrough; keep `DEMO_MODE=true` + empty SMTP vars for the live demo, NEVER in prod.
- **Timing-equality isn't proof**: bcrypt-vs-dummy-hash equalizes the dominant cost, but
  first-request JIT/DB-cold variance exists; acceptable — byte-identical bodies + ~equal
  latency satisfies the AC's "comparable" bar.
- **proxy.ts matcher already excludes farmer-app paths** — locale rewriting stays out of
  auth/app routes; `/verify` added under `(farmer)` inherits that exclusion automatically.
  No proxy changes planned; revisit only if an auth page moves under `[locale]`.
