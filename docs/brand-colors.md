# Agropioo — Brand Colors (Developer Reference)

> A focused, implementation-first reference for the Agropioo color system.
> The full narrative identity lives in [brand-identity.md](./brand-identity.md); the landing direction lives in [landing-page-design.md](./landing-page-design.md).
> This file is the single source of truth for **tokens, Tailwind class names, and accessible color pairs**.

## Where the colors come from

Every Agropioo color is extracted from the **Agropioo logo** — a green teardrop holding a sprouting seedling, circuit traces, and curved furrows — and extended into a complete, accessible system. The palette is **green-dominant**: greens own the experience, with earth/gold tones grounding it and a neutral scale for text.

The logo favors light backgrounds, so the product ships in **light mode** by default.

---

## Primary greens (the core identity)

Greens dominate. Use them for headings, primary actions, links, icons, and key moments.

| Token | Hex | Tailwind class | Role |
|-------|-----|----------------|------|
| `--agro-forest` | `#013B1F` | `agro-forest` | Deepest green; headings, primary text accents, strong marks |
| `--agro-canopy` | `#1C6428` | `agro-canopy` | Primary brand green; buttons, links, key moments |
| `--agro-leaf` | `#3F8839` | `agro-leaf` | Fresh green; highlights, icons, progress, success |
| `--agro-sprout` | `#C1D8C1` | `agro-sprout` | Soft green; backgrounds, subtle fills, dividers |

### Secondary / earth tones

Ground the interface in soil, harvest, and sun.

| Token | Hex | Tailwind class | Role |
|-------|-----|----------------|------|
| `--agro-earth` | `#8B6F47` | `agro-earth` | Soil brown; earthy accents, harvest imagery |
| `--agro-wheat` | `#D4A843` | `agro-wheat` | Warm gold; the primary conversion CTA, premium moments |
| `--agro-stone` | `#F5F2EC` | `agro-stone` | Warm off-white; section backgrounds |
| `--agro-clay` | `#E8E0D5` | `agro-clay` | Neutral warm gray; cards, borders, subtle separation |

### Neutral scale

| Token | Hex | Tailwind class | Role |
|-------|-----|----------------|------|
| `--agro-ink` | `#0F172A` | `agro-ink` | Primary body text on light backgrounds |
| `--agro-slate` | `#475569` | `agro-slate` | Secondary text, captions, meta |
| `--agro-cloud` | `#94A3B8` | `agro-cloud` | Placeholder text, disabled states |
| `--agro-paper` | `#FFFFFF` | `agro-paper` | Primary background |
| `--agro-night` | `#05140C` | `agro-night` | Deep dark background (reserved, not used in light mode) |
| `--agro-mint` | `#F0FDF4` | `agro-mint` | Soft mint section fill |

### Semantic aliases

| Token | Hex | Role |
|-------|-----|------|
| `--agro-success` | `#3F8839` | Success, healthy crops, completed actions |
| `--agro-warning` | `#D4A843` | Warnings, seasonal alerts |
| `--agro-error` | `#B91C1C` | Errors, critical advisories |
| `--agro-info` | `#1E6B7A` | Information, water/weather context |

---

## How the tokens are wired

Tokens are declared once in `apps/frontend/src/app/global.css` inside the Tailwind v4 `@theme` block, prefixed as `--color-agro-*`. Tailwind v4 auto-generates utility classes from every `--color-*` token, so all of these are available as:

```
bg-agro-canopy      text-agro-forest     border-agro-sprout
bg-agro-wheat       text-agro-slate      ring-agro-canopy
from-agro-leaf      to-agro-forest       fill-agro-leaf
```

Opacity modifiers work out of the box: `bg-agro-canopy/10`, `text-agro-forest/80`.

> **Rule:** never inline hex values in components. Reference tokens via the generated classes or `var(--color-agro-*)`. If you need a value that is not a token, add it to the `@theme` block first.

---

## Accessible color pairs

Contrast is verified for the **light mode** the product ships in. Farmers view the app outdoors on mobile — high contrast is a product requirement, not a nicety.

### Text on backgrounds

| Foreground | Background | Ratio | Use |
|------------|------------|-------|-----|
| `--agro-ink` `#0F172A` | `--agro-paper` `#FFFFFF` | ~17:1 | Primary body text ✅ AAA |
| `--agro-slate` `#475569` | `--agro-paper` `#FFFFFF` | ~7.5:1 | Secondary text ✅ AAA |
| `--agro-forest` `#013B1F` | `--agro-paper` `#FFFFFF` | ~15:1 | Headings ✅ AAA |
| `--agro-canopy` `#1C6428` | `--agro-paper` `#FFFFFF` | ~5.9:1 | Headings/links ✅ AA |
| `--agro-forest` `#013B1F` | `--agro-mint` `#F0FDF4` | ~16:1 | Headings on mint ✅ AAA |
| `--agro-slate` `#475569` | `--agro-mint` `#F0FDF4` | ~8:1 | Body on mint ✅ AAA |
| `--agro-paper` `#FFFFFF` | `--agro-canopy` `#1C6428` | ~5.9:1 | White text on canopy buttons ✅ AA |

### The harvest-gold CTA (important)

`--agro-wheat` `#D4A843` is the **primary conversion** color. White text on it fails contrast (~2.3:1), so the gold CTA button must use **dark text**:

| Foreground | Background | Ratio | Use |
|------------|------------|-------|-----|
| `--agro-forest` `#013B1F` | `--agro-wheat` `#D4A843` | ~7:1 | Gold CTA button text ✅ AAA |
| `--agro-ink` `#0F172A` | `--agro-wheat` `#D4A843` | ~8:1 | Alt gold CTA text ✅ AAA |

### Avoid for small text

| Pair | Ratio | Note |
|------|-------|------|
| `--agro-leaf` `#3F8839` on white | ~3.6:1 | ❌ fails for body; icons/large labels only |
| `--agro-leaf` `#3F8839` on mint | ~3.9:1 | ❌ same — use for non-text only |
| `--agro-wheat` `#D4A843` on white | ~2.3:1 | ❌ never for text |

---

## Working rules

1. **Greens dominate.** Canopy is the brand; leaf is the freshness; sprout is the breath. Earth tones accent, never lead.
2. **One gold moment.** Harvest gold is reserved for the single primary conversion action — "Get early access." Don't scatter it.
3. **Mint is the section rest.** Alternate `--agro-paper` and `--agro-mint`/`--agro-stone` fills to give the page air without flat white monotony — but never tint toward pure `#ffffff` or pure `#000000`.
4. **Text stays ink/slate/forest.** Leaf and wheat are non-text colors.
5. **Outdoor-readable.** Body text minimum 4.5:1; aim higher. The farmer is in the field, not in a dim office.

---

*Derived from the Agropioo logo and [brand-identity.md](./brand-identity.md). Update when the logo or identity evolves.*
