# OTP Verification — Spec

> One shared 6-digit verification screen used by two flows: (A) first login / new-device verification after correct credentials, and (B) step 2 of password reset. UI-only demo build.

## Goal

Prove the person signing in or resetting a password owns the email on the account — with an interaction so simple a first-time smartphone user completes it without help, and so trustworthy it never leaks whether a code was right, wrong, or half-right.

## User scenarios

1. **Farmer signs in for the FIRST time** → credentials accepted → this screen appears: "Verify it's you", masked email shown, six code boxes focused and ready. They type/paste the code → flow continues to `/dashboard`.
2. **Farmer resets password** → after step-1 email confirmation → same screen: "Check your email" context. Verified code hands off to the new-password step.
3. **Trusted device** → this screen does NOT appear; sign-in goes straight to the dashboard (documented branch; enforcement is backend's job once wired).
4. **Farmer mistypes one digit** → inline "That code didn't match. Please try again." Boxes clear, focus returns to first box.
5. **Farmer waits and resends** → resend link counts down from 30 seconds, then re-enables; new code replaces the old; attempt count resets.
6. **Farmer pastes "1 2 - 3 4 5 6"** from an SMS/email copy → formatting stripped, all six boxes fill, auto-submit fires.
7. **Demo observer** → clearly-labelled demo banner shows the correct code so the flow can be walked without an inbox.

## Functional requirements

- **FR1 Code entry.** Six single-digit boxes, numeric input only (non-digits rejected as typed). Auto-advance forward on entry; backspace on an empty box steps to the previous box. Verify button disabled until all six digits exist.
- **FR2 Paste handling.** Pasting into any box distributes digits across boxes after stripping spaces/dashes/other separators; if ≥6 clean digits arrive, auto-submit.
- **FR3 Auto-submit.** Completing the sixth digit submits automatically. Manual Verify button still present for reassurance and retry.
- **FR4 Context awareness.** Heading + supporting line switch by flow: (A) "Verify it's you — we sent a 6-digit code to your email" · (B) "Check your email". Destination rendered masked (e.g., `a***@gmail.com`). Both flows share identical layout, inputs, and actions.
- **FR5 Error states.**
  - Wrong code: generic inline message (aria-live), boxes clear, focus to first box. No hint about which digits were wrong.
  - Incomplete code + Verify press: focus jumps to the first empty box (no error text).
  - Attempt limit: after 5 failures, lock message directs to resend; Verify disabled until a fresh code arrives.
  - Expired code: expiry notice with resend prompt (expiry owned by flow wiring; UI renders the state).
- **FR6 Resend.** Link/button with visible 30-second countdown ("Resend code in 0:28"), then re-enabled. Each resend issues a replacement code and resets attempts. Resend target ≥44px.
- **FR7 Loading & success.** Verify/resend show loading state; success hands off to the parent flow (dashboard hand-off for A, password-step hand-off for B). No success interstitial of its own.
- **FR8 Escape hatches.** Flow A: "Use a different account" → back to `/login`. Flow B: "Back" returns to step 1 (`/forgot-password`).
- **FR9 Demo affordance.** Persistent, clearly-labelled demo banner revealing the current correct code (styled distinctly from real content). Removable once real delivery exists — recorded as a production note, not silent behaviour.
- **FR10 Auth shell consistency.** Same split-panel forest brand aesthetic as login/signup/forgot-password; single column under lg; language placeholder visible.
- **FR11 Accessibility.** The six boxes behave as one labelled group ("6-digit verification code"); error messages announced via `aria-live`; countdown changes announced politely; full keyboard path; ≥44px targets; 4.5:1 contrast; reduced-motion respected (error feedback must not rely on animation alone).

## Edge cases & rules

- Non-digit keypresses never enter any box; middle-of-code edits shift subsequent digits correctly.
- Paste shorter than 6 digits → fills what arrived, focuses next empty box, no submit.
- Re-paste over existing digits fully replaces them.
- Rapid double-submit is idempotent (loading state guards it).
- Countdown survives re-renders; navigating away and back mid-flow restarts cleanly at a fresh state (no persistence promised).
- Masked email handles short local-parts gracefully (never renders empty mask).
- Generic-error rule holds even when the demo banner reveals the code — banner is explicitly marked demo-only.
- Numbers contract with `specs/forgot-password/spec.md`: cooldown 30s, attempts 5 — defined HERE, referenced there, never duplicated.

## Out of scope

- Real code generation/delivery (email/SMS), backend verification, rate limiting, device-trust storage
- SMS OTP, authenticator-app TOTP, WhatsApp delivery
- "Manage trusted devices" settings surface
- Remembering partial progress across refresh
- Dark mode, translated strings (structure ready only)

## Acceptance criteria

- [ ] Six boxes render with numeric-only entry, auto-advance, backspace-back behaviour demonstrated
- [ ] Paste with spaces/dashes fills correctly and auto-submits at 6 digits
- [ ] Verify disabled until complete; incomplete + Verify focuses first empty box
- [ ] Wrong code → generic aria-live error, cleared boxes, focus restored; 5th failure shows lock message disabling Verify until resend
- [ ] Resend shows live 30s countdown then re-enables and resets attempts
- [ ] Context heading switches between flow A ("Verify it's you") and B ("Check your email") with masked destination
- [ ] Both escape hatches navigate to their parents
- [ ] Demo banner visibly labelled and distinct from real content
- [ ] Keyboard-only pass succeeds end-to-end; screen-reader announces errors
- [ ] Split-panel shell matches other auth screens; no horizontal scroll at 320px
- [ ] `npm run lint` and `npm run build` pass
