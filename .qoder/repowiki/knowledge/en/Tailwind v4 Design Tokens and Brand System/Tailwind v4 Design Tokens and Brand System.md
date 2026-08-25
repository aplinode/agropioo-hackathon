---
kind: frontend_style
name: Tailwind v4 Design Tokens and Brand System
category: frontend_style
scope:
    - '**'
source_files:
    - app/globals.css
    - postcss.config.mjs
    - package.json
    - docs/brand-colors.md
    - design-system/agropioo/MASTER.md
    - components/EarlyAccessForm.tsx
    - components/Features.tsx
---

## What system/approach is used

Agropioo uses **Tailwind CSS v4** (via `@tailwindcss/postcss` in `postcss.config.mjs`) with the new `@import "tailwindcss"` single-import syntax. There is no separate `tailwind.config.js`; all styling configuration lives in a single global stylesheet (`app/globals.css`) using Tailwind v4's `@theme` and `@theme inline` blocks. Components are styled exclusively with utility classes — there is no SCSS, Sass, or component-scoped CSS framework.

The project also ships a human-readable **Design System Master File** at `design-system/agropioo/MASTER.md` that documents color tokens, typography, spacing, shadows, component specs, style guidelines, anti-patterns, and a pre-delivery checklist. This file acts as the design-spec reference for contributors; it is not consumed by the build but guides implementation.

## Key files and packages

- `package.json` — declares `tailwindcss: ^4` and `@tailwindcss/postcss: ^4` as dev dependencies; Next.js 16 + React 19 app.
- `postcss.config.mjs` — registers `@tailwindcss/postcss` plugin; no other PostCSS plugins.
- `app/globals.css` — the single source of truth for the runtime theme:
  - Declares CSS custom properties under `:root` for brand colors (`--agro-*`).
  - Exposes them to Tailwind via `@theme { --color-agro-* }` so utilities like `bg-agro-canopy`, `text-agro-forest`, `border-agro-sprout` are auto-generated.
  - Maps semantic font families via `@theme inline`: `--font-sans` → DM Sans, `--font-display` → Playfair, `--font-mono` → Geist Mono.
  - Defines global styles: body background/text, focus-visible ring, selection color, smooth scroll, section scroll-margin, `.eyebrow` label class, `.field-ticket` mask, keyframe animations (`rise-in`, `drift`, `draw-line`, `marquee`), scroll-driven reveal via `animation-timeline: view()`, and a `prefers-reduced-motion` block that disables motion.
- `docs/brand-colors.md` — developer reference documenting every token, its hex, role, accessible contrast ratios, and working rules (e.g., gold CTA must use dark text due to contrast).
- `design-system/agropioo/MASTER.md` — design-spec document covering palette, typography, spacing, shadows, button/card/input/modal specs, anti-patterns, and delivery checklist.
- `components/` — all UI components (e.g., `EarlyAccessForm.tsx`, `Features.tsx`, `Hero.tsx`, `Footer.tsx`, `Nav.tsx`, `SiteHeader.tsx`, `Logo.tsx`, `icons.tsx`, `language-switcher.tsx`, `suggestion-chip.tsx`) consume the Tailwind tokens directly via utility classes.

## Architecture and conventions

- **Single-theme CSS variables**: All brand colors are defined once as CSS variables in `:root` and re-exposed through Tailwind's `@theme` block. Components never inline hex values; they use generated utilities like `bg-agro-wheat`, `text-agro-forest`, `border-agro-sprout/40`, `ring-agro-canopy`, etc. The brand-color doc enforces this rule explicitly.
- **Semantic color roles**: Colors are grouped into primary greens (`agro-forest`, `agro-canopy`, `agro-leaf`, `agro-sprout`), earth tones (`agro-earth`, `agro-wheat`, `agro-stone`, `agro-clay`), neutral scale (`agro-ink`, `agro-slate`, `agro-cloud`, `agro-paper`, `agro-night`, `agro-mint`), and semantic aliases (`agro-success`, `agro-warning`, `agro-error`, `agro-info`).
- **Typography tokens**: Three font families are mapped to Tailwind's built-in `font-sans`, `font-display`, and `font-mono` tokens. Headings use `font-display` (Playfair); body uses `font-sans` (DM Sans); labels/eyebrows use `font-mono` (Geist Mono) with uppercase tracking.
- **Utility-first, no custom CSS classes except shared helpers**: Custom classes in `globals.css` are limited to reusable visual primitives: `.display-heading` (overflow-wrap balance), `.eyebrow` (mono label), `.field-ticket` (mask perforation), `.rise`, `.drift`, `.draw`, `.marquee-track`, `.reveal`, and input focus-ring overrides.
- **Motion strategy**: All animations are CSS-only keyframes with progressive enhancement. Scroll-driven reveals use `animation-timeline: view()` inside an `@supports` block so older browsers fall back gracefully. A `prefers-reduced-motion` media query disables all motion.
- **Responsive strategy**: No custom breakpoints or config — relies on Tailwind's default responsive scale applied via utility prefixes (e.g., `sm:p-8`, `lg:col-span-7`).
- **Accessibility defaults**: Global `:focus-visible` outline, minimum 4.5:1 contrast enforced by brand-token rules, reduced-motion respect, and keyboard-accessible focus states.

## Conventions and constraints

Observed conventions (descriptive):
- Components compose layout and appearance entirely from Tailwind utility classes; no per-component CSS files.
- Brand colors are referenced only through generated `agro-*` utilities or `var(--color-agro-*)` / `var(--agro-*)` — raw hex literals are avoided in components.
- The harvest-gold (`agro-wheat`) is reserved for the single primary conversion action; green tones dominate headings, links, and key moments; mint/stone fills alternate for section backgrounds.
- Body text stays on `agro-ink` / `agro-slate` / `agro-forest`; `agro-leaf` and `agro-wheat` are non-text colors (too low contrast for small text).
- Typography uses the mapped font families via `font-display`, `font-sans`, `font-mono` rather than direct font-family strings.
- Animations are declared as named keyframes in `globals.css` and applied via small helper classes (`.rise`, `.drift`, `.draw`, `.marquee-track`, `.reveal`).
- Scroll behavior is globally smooth with `scroll-behavior: smooth` and sections offset by `scroll-margin-top` to account for fixed headers.

Enforced or documented rules (from authoritative sources):
- `docs/brand-colors.md` states: *"never inline hex values in components. Reference tokens via the generated classes or `var(--color-agro-*)`. If you need a value that is not a token, add it to the `@theme` block first."*
- `docs/brand-colors.md` mandates light-mode contrast ratios of at least 4.5:1 for body text and specifies which color pairs fail (e.g., white-on-gold fails ~2.3:1, so gold CTAs must use dark text).
- `design-system/agropioo/MASTER.md` lists anti-patterns to avoid: emojis as icons, missing `cursor:pointer`, layout-shifting hovers, low contrast, instant state changes, invisible focus states, and ignoring `prefers-reduced-motion`.
- `MASTER.md` pre-delivery checklist requires: consistent icon set (Heroicons/Lucide), hover transitions (150–300ms), visible focus states, `prefers-reduced-motion` respected, responsive testing at 375/768/1024/1440px, no horizontal scroll on mobile.
- `app/globals.css` includes a `prefers-reduced-motion` block that disables scroll smoothing and all animations, enforcing motion accessibility.