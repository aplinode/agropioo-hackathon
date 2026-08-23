# Forgot Password — Research

> Findings before the spec. Decisions live in `spec.md`.

## 1. How password reset is usually done

**Standard 3-step flow (industry default):**

```
"Forgot password?" link
   ▼
Step 1 — identify: enter email
   ▼
Step 2 — channel confirm + verify code (OTP here, per founder decision)
   ▼
Step 3 — set new password (+ confirm)
   ▼
Success → back to /login
```

**Key conventions found across major products:**

- **Generic confirmation messaging** ("if that email exists, we sent a code") — prevents account enumeration; attackers can't probe which emails are registered.
- **Visible progress indicator** for multi-step flows — reduces abandonment; users forgive extra steps when they can see the map.
- **Resend with cooldown** on the verification step (owned by the shared OTP screen — see `specs/otp-verification`).
- **Password rules surfaced before typing**, not after failing them; show/hide toggle is now standard.
- **Escape hatches everywhere:** back to login from every step, "try another email" after step 1.

## 2. What this repo gives us

- **IA already reserves the routes:** `/forgot-password` (request) and `/reset-password` (set new password). The middle OTP step uses the shared verification screen (founder decision: same design both flows).
- **Login page currently fakes it:** `app/login/login-form.tsx` points "Forgot password?" at a `mailto:` link — this feature replaces that with a real route link.
- **Visual precedent to match:** login/signup split-panel layout — dark `--agro-forest` brand panel (left, desktop only) with logo, display headline, platform points; white form column (right) with eyebrow → display heading → form. Mobile collapses to single column with compact logo header.
- **Form patterns established:** h-12 inputs, clay border → canopy focus ring, inline field errors with `aria-invalid`/`aria-describedby`, role="alert" error banner, loading spinner state on submit button.
- **API layer exists in name only:** IA lists `app/api/auth/forgot-password` and `/api/auth/reset-password`; nothing implemented. This spec covers UI only.

## 3. Flow documentation

```
FORGOT PASSWORD FLOW (UI-only demo)

/login ──"Forgot password?"──►  /forgot-password
                                  │  Step 1 of 3 · email form
                                  │  submit → generic confirmation
                                  ▼
                        SHARED OTP VERIFICATION SCREEN
                        (specs/otp-verification — same design as login verify)
                                  │  context heading: "Check your email"
                                  │  wrong code ×5 → locked message + resend path
                                  │  resend → 30s cooldown
                                  │  verified
                                  ▼
                              /reset-password
                                  │  Step 3 of 3 · new password + confirm
                                  │  rules shown upfront, show/hide toggle
                                  │  success
                                  ▼
                    Success confirmation ──► /login
                                  (sign in with new password)

Demo affordance: correct code displayed in a clearly-labelled
demo banner so judges can walk the full flow without an inbox.
```

**Branch behaviours:** unknown email still shows generic "code sent" confirmation (no enumeration); expired code → expiry notice + resend (owned by OTP spec).

## 4. Founder decisions locked in interview

1. Flow shape: **Email → OTP → New password** as three separate screens with visible progress.
2. OTP step **reuses the shared verification screen design** (context text differs).
3. Scope: UI only this release — no email delivery, no token backend.
