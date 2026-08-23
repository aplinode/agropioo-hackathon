# Forgot Password — Spec

> Three-step password recovery flow: identify → verify code → set new password. UI-only demo build; the verification step is the shared OTP screen (see `specs/otp-verification/spec.md`).

## Goal

Let a farmer who forgot their password get back into their account without help, in their own language, on a phone — while not leaking whether any email is registered.

## User scenarios

1. **Farmer taps "Forgot password?" on /login** → lands on step 1, sees a 3-step progress indicator (Email · Verify · New password), enters their email.
2. **Farmer submits an email** → sees generic confirmation ("If that email has an account, a 6-digit code is on its way") with the address echoed; auto-advances to the shared OTP verification screen with reset-flow context heading ("Check your email").
3. **Farmer verifies the code** → advances to step 3: new password + confirm password form with rules shown upfront and show/hide toggles.
4. **Farmer sets a valid new password** → success confirmation ("Your password is updated") with a clear path to sign in; back at /login they use the new password.
5. **Farmer gives an email that isn't registered** → sees exactly the same confirmation as everyone else (no hint the account doesn't exist).
6. **Farmer remembers their password mid-flow** → "Back to sign in" link from every step.

## Functional requirements

- **FR1 Step 1 — Identify.** Route surface `/forgot-password`. Single email field with inline validation (empty / malformed) using existing field-error patterns; primary submit button with loading state; "Back to sign in" link above the heading.
- **FR2 Generic confirmation.** After submitting ANY well-formed email, show the same neutral confirmation regardless of account existence. Echo the entered email in the confirmation copy so the farmer can spot typos.
- **FR3 Progress indicator.** All three steps visible as a labelled stepper (Email · Verify code · New password): completed steps ticked, current step highlighted, future steps muted. Present on every screen of the flow.
- **FR4 Step 2 — Verify (shared OTP screen).** The verification step IS the shared OTP screen defined in `specs/otp-verification/spec.md`, rendered in reset context: heading "Check your email", destination shows the masked email from step 1. All its rules (6 boxes, paste, resend cooldown, attempt limit, demo-code banner) apply unchanged.
- **FR5 Step 3 — New password.** Route surface `/reset-password`. Two fields: new password and confirm password. Password rules displayed BEFORE typing (minimum 8 characters). Each field has show/hide toggle. Inline errors: empty, too short, mismatch between the two fields.
- **FR6 Success state.** Full-screen confirmation: success icon, "Password updated" headline, one line of reassurance, single CTA "Sign in" → `/login`. No auto-redirect.
- **FR7 Escape hatches.** Every step offers "Back to sign in". Step 1 additionally offers nothing else (no username option this release).
- **FR8 Auth shell consistency.** Uses the same split-panel auth aesthetic as login/signup: dark forest brand panel (desktop only) with logo + display headline + platform points; white form column; mobile collapses to single column with compact logo header. Language switcher placeholder visible like other auth screens.
- **FR9 Demo affordance.** A clearly-labelled demo banner reveals the correct verification code so the full flow can be demonstrated without a real inbox. Visually distinct from real content, honest about being a demo.
- **FR10 Accessibility & tokens.** Same baseline as dashboard spec: ≥44px targets, 4.5:1 text contrast, focus rings, reduced-motion respected, agro tokens only, no page-level horizontal scroll at 320px.

## Edge cases & rules

- Malformed email blocks submit with inline error; no request implied.
- Unknown-but-valid email → identical generic confirmation path (FR2); never "account not found".
- Refreshing mid-flow returns to step 1 (no state persistence promised this release).
- Direct navigation to `/reset-password` without completing earlier steps → still renders the form in demo mode (UI-only), but production note recorded: must guard against out-of-order access once wired.
- Confirm-password check runs only after both fields have content (no premature error while typing the first).
- Resend/attempt/expiry behaviour is owned entirely by the OTP spec — no duplicated or conflicting numbers here.
- Stepper state never lies backwards: returning to step 1 after verifying keeps steps marked complete only within a live session.

## Out of scope

- Real email sending, token generation, backend verification, rate limiting
- SMS-based recovery, security questions, "remember device" management
- Auto-login after reset (farmer signs in normally)
- Translated strings (English launch copy; structure ready for DB-driven translations)
- Dark mode

## Acceptance criteria

- [ ] "Forgot password?" on /login links to the flow (replaces current `mailto:` stub)
- [ ] Stepper renders on all three steps with correct completed/current/future states
- [ ] Valid-format submit → generic confirmation echoes email → OTP screen appears with "Check your email" context and masked address
- [ ] Known and unknown emails produce byte-identical confirmations
- [ ] Wrong-format email shows inline error and stays on step 1
- [ ] Verified code → step 3 renders both password fields with upfront rules, toggles, and all three error cases demonstrated
- [ ] Valid submission → success screen with single "Sign in" CTA landing on /login
- [ ] Demo banner clearly marks the revealed code as demo-only
- [ ] Split-panel auth shell matches login/signup visually on desktop; single column under lg
- [ ] Keyboard-only pass across all three steps succeeds with visible focus
- [ ] `npm run lint` and `npm run build` pass
