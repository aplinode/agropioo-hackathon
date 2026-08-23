# Dashboard — Spec

> Farmer app home screen. UI-only demo build; data comes from demo mock data.

## Goal

Give the farmer one screen that answers "kya karoon aaj?" — today's most important action, weather, and warnings at a glance, with every tool one tap away. It is the home the farmer returns to daily, so it must scan in seconds on a phone in sunlight.

## User scenarios

1. **Returning farmer opens the app** → sees greeting header, today's advisory for their crop, weather snapshot, active alerts, quick actions, Detect CTA, and their farms as cards. Tapping any card/action navigates to that destination.
2. **First-run farmer (no farms yet)** → same shell but with a welcoming empty state: an invitation to add their first farm, setup checklist prominent, generic seasonal advisory (no crop-specific content), no alerts ("calm" state).
3. **Farmer taps a quick action** → lands directly on that tool (record entry, advisor chat, detect, prices) without intermediate menus.
4. **A critical weather/pest alert exists** → alert strip shows it first with severity styling; tapping opens the notifications view.
5. **Farmer switches device** → mobile shows bottom tab bar; desktop shows sidebar; content identical.

## Functional requirements

- **FR1 App shell.** Mobile: bottom tab bar with exactly 5 tabs — Dashboard, Farms, Advisor, Detect, More. Desktop (≥ lg): left sidebar listing all tools — Dashboard, Farms, Advisor, Detect, Prices, Schemes, Notifications, Settings — plus logo and sign-out. Active item visually distinct on both.
- **FR2 Header.** Top of page: time-neutral greeting with farmer's first name, notification bell with unread badge count, visible language control showing "EN" (placeholder — visibly interactive target but non-functional this release), avatar/profile affordance. Every element ≥44×44px touch target.
- **FR3 Today's advisory.** One primary card: crop name + growth stage tag, the single recommended action in plain words, a one-line "why", and a link into the advisor. Dated "Today".
- **FR4 Weather snapshot.** Location name, current temperature °C, condition label with icon, today's high/low, rain-chance line, link to full weather view.
- **FR5 Alerts strip.** Active alerts sorted by severity (critical → warning → info); each row: type icon, message, relative time. Show top 3 maximum, then "View all alerts".
- **FR6 Quick actions.** Exactly 4 shortcuts: Add record, Ask advisor, Scan crop (detect), Check prices. Icon + label each, ≥44px targets, evenly weighted.
- **FR7 Detect CTA (the one strong moment).** Full-width card in deep brand green (forest/canopy family) with light text — photo-upload pitch for disease detection linking to `/detect`. This is the page's single high-emphasis surface. Founder decision 2026-08-23: palette is restricted to greens + whites/neutrals for this release — no harvest gold, no earth tones, no non-green hues anywhere on farmer-app screens; alert severity and errors are expressed through green-intensity tints, icons, and text labels instead of colour hue.
- **FR8 My farms overview.** Card per farm: farm name, crops grown, growth stage, simple health indicator. Horizontal scroll on mobile, grid on desktop. Final tile = "+ Add farm". Tap → farm detail.
- **FR9 Setup checklist.** Card shown while items are incomplete: add first farm, ask the advisor once, run first detection. Shows progress count; dismissible via close icon.
- **FR10 Empty states.** (a) No farms: welcome hero + "Add your first farm" primary CTA + checklist; hide FR3 crop-specifics and FR5 list (show calm message). (b) No alerts: "No alerts today — your crops are calm." (c) Weather unavailable: explanatory fallback line, not an error dump.
- **FR11 Demo data.** All content from typed mock data with Pakistan-first realism (Pakistani names, Multan/Sahiwal-class locations, wheat/cotton/sugarcane/maize, °C). No invented "proven results" or fake testimonials anywhere.
- **FR12 Copy & i18n readiness.** English at launch, farmer-first plain language ("what to do, when to do it"). Strings centralized so DB-driven translations can replace them later.
- **FR13 Accessibility & layout rules.** Body text ≥4.5:1 contrast; visible focus rings; no horizontal page scroll at 320px (contained horizontal scroll allowed only inside the farms carousel); respects `prefers-reduced-motion`; layout uses logical properties so Urdu/Pashto RTL mirrors cleanly when those ship.

## Edge cases & rules

- Farm/crop names longer than 2 lines truncate with ellipsis (full name available to screen readers).
- More than 3 alerts → top 3 by severity only + View all; badge count reflects ALL unread, not just shown 3.
- Checklist dismissal must survive navigation within the session.
- With no farms: FR4 still renders (location-level weather is farm-independent); FR3 falls back to generic seasonal tip.
- Bell with zero unread shows no badge dot.
- Greeting stays "Assalam-o-Alaikum" regardless of time of day (no time-of-day variants this release).
- Mock weather/alert values must be internally consistent (e.g., rainy advisory ↔ rain chance high).

## Out of scope

- Real API/database wiring, live weather/prices, real authentication state
- Notifications center page content, settings page, farm detail pages (nav links may point at placeholder routes)
- Language switching behaviour (placeholder only), RTL rendering itself
- Pull-to-refresh, push notifications, offline/PWA behaviour, dark mode
- Voice input/output

## Acceptance criteria

- [ ] Mobile 320–430px: bottom bar shows exactly 5 tabs, correct active state on `/dashboard`, no page-level horizontal scroll
- [ ] Desktop ≥1024px: sidebar lists all 8 destinations with active state; bottom bar hidden
- [ ] Header contains greeting + bell w/ badge count + EN placeholder + avatar; all ≥44px targets
- [ ] Advisory, weather, alerts, quick actions (exactly 4), green Detect CTA, farms row, checklist all present in DOM order above
- [ ] NO non-green hue anywhere: zero `--agro-wheat`/earth/red/teal surfaces; severity and error states use green-intensity tints + icons + labels
- [ ] No-farms variant renders welcome hero + add-farm CTA + calm alert/weather fallbacks
- [ ] No-alerts and weather-unavailable fallback strings render correctly
- [ ] All colours come from `--color-agro-*` tokens; no inline hex
- [ ] Keyboard-only pass: every action reachable, focus ring visible
- [ ] `npm run lint` and `npm run build` pass
