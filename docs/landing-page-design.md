# Agropioo Landing Page — Design Notes

## Direction

A single-page marketing landing for Agropioo that feels **elegant, professional, and exciting** while staying firmly inside the brand's green identity. The page is built in **light mode** so it remains readable outdoors on mobile devices and feels open and optimistic.

## Design System Anchors

- **Macrostructure:** Marquee Hero → Feature Grid → Farmer Journey → Pakistan-first Statement → Final CTA → Footer
- **Visual genre:** Organic editorial — clean white space, confident serif display type, rounded cards with subtle botanical curves, restrained green palette.
- **Signature element:** A large, soft-green hero panel that combines the Agropioo logo with a flowing furrow-curve motif — the moment the page should be remembered by.

## Color Use

All colours come from `docs/brand-identity.md`:

- **Background:** white (`--agro-paper`) with soft mint section fills (`#F0FDF4`).
- **Primary actions:** deep canopy green (`--agro-canopy` #1C6428).
- **Accents / CTA:** harvest gold (`--agro-wheat` #D4A843) for the primary conversion button — it contrasts cleanly with greens without breaking the natural palette.
- **Text:** ink (`--agro-ink` #0F172A) and slate (`--agro-slate` #475569).
- **Borders / subtle fills:** sprout (`--agro-sprout` #C1D8C1).

## Typography

- **Display / H1:** Playfair Display — elegant, editorial, agricultural-journal feeling.
- **Body / UI:** DM Sans — modern, warm, highly legible on phones.
- **Data / small labels:** system mono or DM Sans tabular where needed.

## Sections

1. **Navigation** — logo + wordmark left, compact links right, "Get early access" CTA.
2. **Hero** — large headline, supporting line, two CTAs, logo-and-curve visual.
3. **Features** — four cards: AI Advisor, Digital Farm Record, Local Languages, Weather-Aware Guidance.
4. **How it works** — four-step journey: Add farm → Ask → Get guidance → Record activity.
5. **Pakistan-first** — statement about local crops, languages, practices, with global vision note.
6. **CTA** — strong closing panel with email-style interest form.
7. **Footer** — product of Aplinode, links, copyright.

## Motion

- Subtle fade/slide-in on scroll (pure CSS `@keyframes` with `prefers-reduced-motion` support).
- Button hover: `translateY(-1px)` + shadow lift, 200ms.
- Card hover: shadow lift, no layout shift.

## Accessibility

- Minimum 4.5:1 contrast on body text.
- Visible focus rings (`outline: 2px solid` canopy green).
- Touch targets ≥ 44×44 px.
- No horizontal scroll on mobile; `overflow-x: clip` on root.
- Reduced-motion collapses animations to opacity-only or none.

## Assets

- Logo copied to `apps/frontend/public/logo.png`.
- Icons rendered as inline SVGs (no extra dependency).
- No invented photography, testimonials, or metrics.
