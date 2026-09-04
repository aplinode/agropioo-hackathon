# Agropioo Pitch Deck

Hackathon pitch deck (14 slides, 16:9) generated programmatically with
[PptxGenJS](https://pptxgenjs.org). Brand-faithful: colors come only from
`docs/brand-colors.md`, fonts are Playfair Display / DM Sans / Geist Mono, and
the project logos (dark, light, square) are used.

## Rebuild

```bash
# 1. ensure pptxgenjs is available (the package is not added to the repo;
#    install it in a scratch dir if needed)
npm install pptxgenjs

# 2. regenerate the deck
node build.js
```

`build.js` reads logos from `./assets/` and writes `Agropioo-Pitch-Deck.pptx`
into this folder. Convert to PDF/thumbnails with LibreOffice + poppler:

```bash
soffice --headless --convert-to pdf Agropioo-Pitch-Deck.pptx --outdir .
pdftoppm -jpeg -r 110 Agropioo-Pitch-Deck.pdf slide
```

## Content notes

- Only features actually built in the codebase are claimed (auth, onboarding,
  AI advisor, disease detection, mandi prices, weather advisory, farms/records,
  profit & loss, crop planner, 8-locale i18n, ~246 tests). No features from
  the roadmap/talked-about-only are presented as done.
- Impact numbers (`20–40%`, `30–40%`, `15–25%`) are clearly framed as the
  target opportunity (context framing), not measured results, to respect the
  UI-honesty rule.

## Known PptxGenJS caveat

Decimal `lineSpacing` (e.g. `1.3`) combined with run-level `breakLine: true`
renderers as blank/garbled text when opened in LibreOffice. Avoid it:
- use integer line spacing or none (default), and `paraSpaceAfter` for spacing
- for two-colour headlines, stack two separate `addText` calls instead of an
  array of runs.
