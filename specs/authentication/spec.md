# Authentication — Spec

> Real backend for the four auth surfaces whose UI already exists (`/signup`, `/login`, `/forgot-password`, `/reset-password`) plus the shared OTP screen, including token-based access control across the app. Supersedes the demo-mode limitation recorded in `specs/otp-verification/spec.md` and `specs/forgot-password/spec.md` (their UI rules still stand; see Reconciliation at the bottom).

> **Fixed by constitution** (not re-decided here): all data lives in app-owned PostgreSQL tables managed through Neon Lakebase Postgres — no external auth/BaaS system is used; passwords are stored only as salted one-way hashes (bcryptjs); all signed passes below are JWTs (jose) carried in httpOnly, Secure, SameSite cookies unreadable by page scripts; codes and emails go out via nodemailer + SMTP; every request payload is Zod-validated; every failure returns the uniform `{ error: { code, message } }` shape; auth routes get basic per-IP rate limiting. Schema, route list, and library parameters live in this feature's `plan.md`.

## Goal

Let a farmer create an account, prove they own their email with a simple code, and get back into their account alone if they forget their password — on a phone, without help, without leaking whether an email is registered, and without anyone reaching a protected screen or API they haven't earned entry into. The farmer's data lives only in Agropioo's own database tables, and every door is guarded by a signed pass the server issued itself.

## User scenarios

1. **Farmer fills the signup form** (name, email, optional phone, password, terms) → account created unverified → server hands them a short-lived verification pass → they land on the shared OTP screen told a 6-digit code was emailed.
2. **Farmer enters the correct 6-digit code within the hour** → pass and code are consumed (neither works again) → account becomes verified → success screen with a single path: "Sign in" → `/login`.
3. **Farmer signs in with email + password** (no OTP at login) → server issues a fresh session pass (valid 7 days) → they land inside the app (first-time users continue into `/onboarding`).
4. **Farmer who hasn't verified yet signs in with the CORRECT password** → blocked with a "verify your email" message and taken into the verification screen where a fresh code can be requested.
5. **Wrong password, or an email that has no account** → identical generic "Invalid email or password"; no hint which failed.
6. **Farmer taps "Forgot password?"** (reachable only when signed out) → enters email → generic confirmation (identical whether or not the account exists) → verifies emailed code → sets a new password — an UNVERIFIED account becomes VERIFIED in the same stroke, since the code proved email ownership → signs in normally. Nobody reaches step 3 without having passed step 2.
7. **Code doesn't arrive / expired** → Resend after a 60-second wait; the newest code instantly voids all earlier ones.
8. **Someone hits the verify / resend / set-password / farms APIs directly (curl, Postman) with no pass, a forged pass, an expired one, or the WRONG TYPE of pass** → rejected with the standard error; nothing executes; the UI path ejects to `/login`.
9. **A signed-in farmer opens `/login`, `/signup`, or `/forgot-password`** → redirected straight to the dashboard; those pages are for signing in, not for people already in.
10. **A visitor who never signed in tries `/dashboard` or any app page** → redirected to `/login` until they actually sign in.

## Functional requirements

### Signup

- **FR1 Fields & rules (match ready form).** Name (required, non-empty), email (valid format), phone (optional; if given must look like a real number), password (8–64 characters), confirm password (must match), terms acceptance (required). Client-side inline errors stay; the server independently re-validates everything and rejects with field-level messages.
- **FR2 Duplicate handling.** Signing up with an email that already belongs to a VERIFIED account shows an explicit "This email is already registered" message with links to log in or reset the password. Signing up again with an UNVERIFIED email does not error — it re-runs verification for that same pending account (fresh code, fresh pass). Re-signup NEVER overwrites stored data: the FIRST submission's name, phone, and password hash are final (first-write-wins), including under concurrent races — parallel signups for one unverified email resolve to that ONE pending account.
- **FR3 Password storage.** Only an irreversible hash of the password is ever persisted; plaintext appears nowhere in the database, logs, or errors. Confirm-password exists only at the form layer.
- **FR4 Post-signup state.** A newly created account cannot sign in until its email is verified (scenario 4). No SESSION is created at signup — only the verification pass (FR7).

### Access passes (signed tokens)

- **FR5 Three pass types, strictly isolated.** `verify` (signup email verification), `reset` (password recovery), `session` (signed-in app usage). An endpoint accepts ONLY its own type: a session pass cannot call verify/resend/set-password APIs; a verify pass cannot reach the dashboard or any data API; a reset pass cannot verify a signup. Wrong type = rejected exactly like no pass at all.
- **FR6 Contents & transport.** Verify and session passes carry the account id, email, their type, and an expiry timestamp, signed so any modification invalidates it. A reset pass carries ONLY the submitted email plus its type and expiry — the account may not exist (FR10) — and binds to the account id at the moment code verification upgrades it. All passes travel as httpOnly cookies — JavaScript never reads or stores them.
- **FR7 Verify pass.** Issued once per successful signup submission (and again on duplicate-unverified signup or resend). Valid 1 hour from issue. Required for ALL verification actions: rendering context, resend, and code check. Missing, expired, or invalid pass → ejected from the OTP screen back to `/login` with a neutral message.
- **FR8 Email match.** The code being checked must belong to the SAME account as the pass. A pass for one email paired with a code/payload for another → rejected and the user is ejected with a neutral error.
- **FR9 Single-use consumption.** A successful code check consumes BOTH that code and the pass's current state (a used pass cannot re-run verification; replaying the same request fails). Codes are equally single-use (FR14).
- **FR10 Reset pass.** EVERY well-formed forgot-password submission receives one (so responses stay identical for known and unknown emails); it carries only the submitted email and lives 1 hour. The code check upgrades it to reset-verified; ONLY a reset-verified pass may call the set-new-password API. Hitting that API without completing verification → standard rejection and eject to `/forgot-password`.
- **FR11 Universal ejection rule.** No pass, forged pass, expired pass, wrong-type pass — all produce the SAME neutral outcome: pages bounce to `/login`, APIs return the standard error. Nothing reveals WHICH check failed.

### Email verification (shared OTP)

- **FR12 One shared screen.** The same OTP interaction defined in `specs/otp-verification/spec.md` serves BOTH purposes: verifying a new signup, and step 2 of forgot-password. Context heading and escape hatches switch per purpose; layout, inputs, and rules are identical.
- **FR13 Code rules.** 6 digits, numeric only. Valid 10 minutes from issue. LAST CODE WINS: issuing a new code (resend, re-signup, re-request) instantly voids every earlier outstanding code for that purpose — an older code stops working the moment a newer one exists, even if not yet expired.
- **FR14 Single-use & attempt limit.** A code stops working once successfully entered (replay fails). After 5 wrong entries the CURRENT code is dead and a resend is required (60-second cooldown enforced SERVER-side, mirrored by the UI countdown). Wrong entries count CUMULATIVELY across resends within one pass: at 10 total wrong entries the pass itself dies — no resend revives it; a fresh pass comes only from a new signup submission or the login verification gate (FR19).
- **FR15 Purpose isolation.** A code issued for signup verification cannot complete a password reset, and vice versa.
- **FR16 Delivery.** The code is emailed as plain text with clear copy ("expires in 10 minutes", sender identity). Never includes the password or any other account data. If sending fails (SMTP error, bounce), the UI shows a neutral "couldn't send, try again" message with a retry — no code is rendered anywhere, responses still never distinguish known from unknown emails, and any already-issued pass stays valid.
- **FR17 Demo fallback.** The clearly-labelled demo banner reveals the current code ONLY when BOTH hold: SMTP is unconfigured AND an explicit `DEMO_MODE=true` env var is set. Either condition missing → codes NEVER render anywhere in the product, so a production deploy that forgets its SMTP vars cannot leak codes.

### Login & session

- **FR18 Password-only sign-in.** Email + password, no OTP at login. Every failure — unknown email, wrong password, malformed body — returns the SAME generic "Invalid email or password" with comparable timing.
- **FR19 Verification gate.** Correct credentials on an unverified account produce the verification prompt (never the dashboard). This check happens only AFTER credentials match, so it reveals nothing to someone without the password. A fresh verify pass is issued here.
- **FR20 Session pass.** Successful sign-in issues a NEW session pass (account id + email + type + 7-day expiry), replacing/clearing any leftover verify or reset passes. Validity is fixed 7 days — no remember-me variants. Each sign-in (on any device) creates its own independently revocable session; MULTIPLE simultaneous sessions per account are allowed, and signing out one device never touches another's.
- **FR21 Logout.** Clears the session cookie immediately; THAT session is dead server-side too (a copied cookie afterwards is useless), while the farmer's OTHER devices stay signed in. Auth pages become reachable again.
- **FR22 Expiry.** An expired or invalid session is treated exactly as signed-out everywhere (see FR25). No auto-refresh complexity this release.

### Forgot password / reset

- **FR23 Step 1 — Identify.** As specced in `specs/forgot-password/spec.md`: any well-formed email gets the byte-identical generic confirmation, whether or not the account exists. Unknown addresses receive no email — but DO receive a useless reset pass (FR10), so responses never differ. The whole flow is SIGNED-OUT-ONLY: arriving with a valid session bounces to the dashboard exactly like the other auth pages (FR28).
- **FR24 Step 2 — Verify.** Shared OTP screen under reset context; FR12–FR16 apply unchanged, gated by the reset pass.
- **FR25 Step 3 — New password.** Gated by a reset-VERIFIED pass (FR10). New password obeys FR1 rules; confirm must match; server re-validates. Success screen offers "Sign in"; NO auto-login.
- **FR26 Reset effects.** Completing a reset stores only the new hash, MARKS AN UNVERIFIED ACCOUNT VERIFIED (the emailed code proved ownership; idempotent for already-verified accounts), voids all outstanding reset codes and passes, and kills ALL existing sessions of that account (every device must sign in again).

### Route protection (whole app)

- **FR27 Every protected page and EVERY data API validates the session pass server-side**: present → signature genuinely ours → type `session` → not expired → account still exists. ANY failure → protected pages redirect to `/login`; APIs return the standard unauthorized error, which the UI turns into a redirect. This guard applies uniformly — farm records, advisor, detect, settings, everything — not per-page discretion.
- **FR28 Signed-in users are pushed OUT of auth pages.** Opening `/login`, `/signup`, `/forgot-password` (or `/reset-password`) with a valid session → immediate redirect to the dashboard.
- **FR29 Guests are locked out of the app.** No valid session → every app page (`/dashboard`, `/farms`, `/onboarding`, …) redirects to `/login`. There is no partially-open app state.

### Cross-cutting

- **FR30 Rate limiting.** TWO independent dimensions guard signup, login, forgot-password, resend, and code verification: per-IP AND per-account. Rationale: Pakistan's mobile networks run CGNAT — thousands of farmers can share one public IP, so IP limits alone would lock out whole networks on one bad actor; per-account limits catch targeted brute-force regardless of which IP it comes from. Exceeding any limit returns the standard error shape with a neutral "try later" message. Exact windows live in the plan.
- **FR31 Enumeration resistance.** No endpoint, error, timing, or log distinguishes "email exists" from "email doesn't exist" except the two intentional cases: duplicate signup (FR2) and post-credential verification gate (FR19).
- **FR32 Language switcher.** Visible on all four auth screens as built; chosen language carries into onboarding (owned by the language/i18n specs).

## Edge cases & rules

- Malformed or missing fields on ANY endpoint → standard validation error; nothing reaches the database; no pass is issued.
- Trimming/case: emails trimmed and lowercased before every comparison and at storage; names trimmed; phone stored as typed (trimmed).
- All pass expiry and code expiry checked SERVER-side against server time (UTC); client clocks never trusted.
- Tampered signature, expired stamp, wrong type, missing cookie — four different causes, ONE identical neutral outcome (FR11); logs may distinguish internally, responses never do.
- Stale tab: farmer verifies in one tab; a second tab sitting on the OTP screen submits next → its pass is already consumed → clean neutral rejection and ejection, no crash.
- Resend during cooldown rejected server-side even if the UI countdown is bypassed; resend requires a live pass of the matching type.
- A pass killed by the cumulative attempt cap (FR14) behaves exactly like an expired pass: same neutral ejection, nothing reveals which happened (FR11).
- Verifying an already-verified account (double-submit, race) resolves idempotently — the second completion lands on the success state, no duplicate rows.
- Concurrent signups racing the same unverified email resolve to ONE pending account holding the FIRST submission's data (first-write-wins); later submissions only re-run verification.
- Reset requested twice in parallel → newest reset pass + code pair wins; the older pair is void (last-code-wins).
- Old password works up to the moment the new hash is saved; no window where neither works.
- Sessions survive server restarts; logout kills the session record so a copied cookie is useless afterwards.
- Errors and logs never contain passwords, hashes, full codes, or raw pass contents (masked at most).

## Out of scope

- SMS / WhatsApp / voice delivery of codes; phone-number login or phone verification
- Social sign-in, magic-link-only login, passkeys, 2FA/TOTP/authenticator apps
- Trusted-device memory, device management UI, "new device" emails
- Refresh-token rotation, sliding sessions, remember-me variants
- Email-change flow; change-password-while-signed-in (all password changes go through signed-out forgot-password); admin role/admin user management; account deletion
- Server-side retry queues / automatic re-sends of failed emails (retry is user-initiated)
- Auto-purge/cron cleanup of long-unverified accounts (rows simply remain)
- Auto-login after verification or reset (manual sign-in both times, per founder decision)
- Translated strings (English launch copy; structure ready for DB-driven translations)
- Dark mode; CAPTCHA

## Acceptance criteria

- [ ] Signup with valid data creates an unverified account, delivers a real 6-digit email (or demo banner exactly when SMTP is unconfigured AND DEMO_MODE=true), and sets an httpOnly verify pass
- [ ] Duplicate VERIFIED email → explicit registered-message with working links; duplicate UNVERIFIED email → fresh code + pass, no error, and ORIGINAL name/phone/password untouched (first-write-wins)
- [ ] Plaintext password never appears in any table column, log line, or error (inspect DB + logs)
- [ ] Correct password on unverified account → blocked with verification screen; wrong password vs unknown email → byte-identical error + comparable latency
- [ ] curl/Postman WITHOUT a pass, with a FORGED pass, with an EXPIRED pass, and with the WRONG-TYPE pass (e.g. session token on verify API) → all rejected identically; nothing executes
- [ ] Verify pass for account A + code for account B → rejected and ejected (email-match rule)
- [ ] Last-code-wins proven: old code rejected immediately after a resend, even inside its 10 minutes
- [ ] Used code cannot be reused; consumed pass cannot re-verify (replay rejected)
- [ ] Code older than 10 minutes rejected with expiry notice; 5 wrong entries kill the current code; resend before 60s rejected server-side; 10 TOTAL wrong entries across resends kill the whole pass (resend refused, neutral ejection)
- [ ] SMTP send failure → neutral retry message, no code rendered anywhere, response identical for known vs unknown emails
- [ ] DEMO banner appears only when DEMO_MODE=true AND SMTP unconfigured; either condition off → codes never render
- [ ] Reset completed on an UNVERIFIED account flips it to verified — immediate successful sign-in afterwards, no second verification code needed
- [ ] Set-password API refuses a reset pass that hasn't passed code verification; completes only with reset-verified pass; after reset all old sessions are dead
- [ ] Verified farmer signs in password-only → session pass set, httpOnly (invisible to console); browser reopen keeps them in
- [ ] Two devices signed in simultaneously; logout on device A leaves device B working; completing a password reset kills BOTH
- [ ] 7 days later (simulated clock) session gone; logout kills access instantly even with a copied cookie
- [ ] Signed-in user opening /login, /signup, /forgot-password → bounced to dashboard; signed-out user opening /dashboard, /farms, /onboarding → bounced to /login
- [ ] A protected data API (e.g. create farm record) called with no/garbage session → standard unauthorized error shape
- [ ] Hammering login/signup/forgot returns standard rate-limit errors — triggered BOTH by volume from one IP and by failures against one account spread across many IPs
- [ ] Zod schemas + handlers covered by automated tests; UI steps walked once manually against this checklist
- [ ] `npm run lint` and `npm run build` pass

## Reconciliation with existing specs (requires edits when this ships)

1. `specs/otp-verification/spec.md` — Flow A (OTP-on-login) REMOVED (password-only login); Flow C added (signup verification); cooldown 30s → 60s; expiry/attempt numbers authoritative HERE (10 min / 5 wrong per code / 10 cumulative per pass / 60 s); demo banner becomes DEMO_MODE-gated SMTP fallback.
2. `app/(site)/[locale]/login/login-form.tsx` — remove the OTP "Step 2 of 2" branch and the Remember-me checkbox (fixed 7-day session).
3. `specs/forgot-password/spec.md` — drop the "backend out of scope" framing; its UI requirements remain fully in force.
