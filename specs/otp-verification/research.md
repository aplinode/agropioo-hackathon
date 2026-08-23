# OTP Verification — Research

> Findings before the spec. Decisions live in `spec.md`. This screen is SHARED by two flows: first-login verification and password reset.

## 1. How OTP/verification screens are usually done

**Converged industry standard (banking, email, fintech, agri apps):**

- **6-digit code, 6 individual boxes** — auto-advance focus as the user types; backspace steps back; paste into any box distributes digits across all boxes (cleaning spaces/dashes).
- **Auto-submit when the sixth digit lands** — users shouldn't need to find the button for a code they just finished typing.
- **Resend with visible cooldown** — typically 30–60s before the link re-enables; shows a countdown so waiting feels intentional.
- **Attempt limits** — commonly ~5 wrong entries → temporary lock message directing to resend.
- **Expiry** — codes live ~10 minutes; expiry surfaces as "code expired, request a new one", never as a silent failure.
- **Generic error text** ("That code didn't match") — no hints about which digits were right.
- **Masked destination** — show where the code went: `a***@gmail.com` builds trust without exposing data.
- **Single logical field semantics** — visually 6 boxes, but accessible as one labelled input sequence; errors announced via `aria-live`.

**Input handling details that separate good from sloppy implementations:** reject non-digits silently on keydown; strip formatting from clipboard content; focus first empty box when Verify is pressed with an incomplete code; disable Verify until 6 digits exist.

## 2. Where this screen lives in Agropioo's flows

```
FLOW A — FIRST LOGIN VERIFICATION (founder decision: first time / new device ONLY)

/login ── correct email + password ──► trusted device? ──yes──► /dashboard
                                          │no
                                          ▼
                              OTP SCREEN (context: "Verify it's you")
                                          │ verified
                                          ▼
                                     /dashboard


FLOW B — PASSWORD RESET STEP 2

/forgot-password ── generic confirmation ──► OTP SCREEN (context: "Check your email")
                                                │ verified
                                                ▼
                                           /reset-password
```

Same component design, same rules; only heading/context copy differs per flow.

## 3. What this repo gives us

- **No OTP UI exists yet anywhere** — this spec creates it once, shared by both flows.
- **Auth aesthetic precedent** (`app/login/login-form.tsx`): split-panel forest brand shell desktop, single-column mobile, h-12 canopy buttons, inline `role="alert"` banners.
- **Demo reality:** no email backend exists. Founder-approved honest demo pattern — a clearly-labelled banner reveals today's demo code so judges/stakeholders can walk both flows end-to-end.
- **Icon set** has Check/Close/Languages already; may need a shield/lock glyph for the verify context header.

## 4. Founder decisions locked in interview

1. **Purpose:** OTP guards TWO moments — (a) first login or login from a new device, (b) second step of password reset.
2. **Frequency:** NOT every login — only first-ever login and new-device logins.
3. **Design:** ONE shared screen design for both flows; routes differ, look identical.
4. **Scope:** UI-only demo build (screen itself not built this cycle — dashboard ships first).
