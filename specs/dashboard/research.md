# Dashboard — Research

> Findings before the spec. No design decisions here — those live in `spec.md`.

## 1. How farmer-app home screens are usually done

**Common pattern (progressive web apps for agriculture / rural users):**

1. **Personal greeting header** — name + avatar + notification entry point. Establishes "this is your farm's home".
2. **One primary advisory moment** — today's single most important action ("what to do, when to do it"), not a wall of data. Rural-UX studies consistently show one clear instruction beats many metrics.
3. **Weather snapshot near the top** — weather drives most daily farming decisions (irrigate, spray, harvest).
4. **Alerts surfaced, not buried** — severity-sorted strip; tapping reveals detail.
5. **Quick actions as large touch targets** — 3–5 shortcuts max, each ≥44px.
6. **Farms overview** — card per farm with crop + stage + health at a glance.
7. **Navigation: bottom tab bar on mobile (max 5 tabs), sidebar on desktop** — the dominant app-shell convention; thumb-reachable, always visible.

**Main approaches considered:**

| Approach | Trade-off |
|---|---|
| Bento/grid of widgets | Looks impressive but overwhelms low-literacy users; hard to scan in sunlight |
| Single-column scroll with clear sections | Simplest scan order, mobile-first, chosen direction |
| Tabbed dashboard (swipe between panels) | Hides content behind gestures; discoverability risk |

## 2. What this repo already gives us

- **Route group `(dashboard)`** is pre-planned in `docs/information-architecture.md` — `/dashboard` is its first page.
- **Tokens wired:** `app/globals.css` `@theme` has every `--color-agro-*` token; utilities like `bg-agro-canopy`, `text-agro-forest` are available.
- **Fonts:** DM Sans body, Playfair display (`--font-playfair`), Geist Mono data face — set as CSS vars in `app/layout.tsx`.
- **Existing icon set** (`components/icons.tsx`): Sprout, Record, Languages, Weather, ArrowRight, MapPin, Message, Compass, Pencil, Check, Menu, Close. **Missing for dashboard:** bell/notification, camera/scan, price/chart, home, grid/more, plus, chevron, user/avatar fallback. Additions go into the shared icon file (allowed — it IS the shared SVG set).
- **Auth aesthetic precedent:** `app/login/login-form.tsx` split-panel (forest brand panel desktop / white form mobile) sets the visual language; buttons are h-12 rounded-lg canopy→forest hover; inputs h-12 clay-border with canopy focus ring.
- **Gold rule:** exactly ONE `--agro-wheat` conversion moment per page → the Detect CTA card is that moment (dark forest text on gold).
- **Demo scope** (`AGENTS.md`): build order puts `/dashboard` second after onboarding.

## 3. Data approach for UI-only demo

Decision from founder interview: mock data lives in a **separate typed module** (not inline in components) so later API wiring is a mechanical swap. Realistic Pakistani content: names (Ali, Ramesh-style diversity ok but Pakistan-first → e.g., Muhammad Ali, Fatima), crops (wheat گندم, cotton, sugarcane, maize, rice), locations (Multan, Sahiwal, Faisalabad, Vehari), temps °C, growth stages in plain words.

## 4. Flow documentation (where dashboard sits)

```
LOGIN FLOW
/login
  └─ email + password submit
       ├─ wrong credentials → inline error, retry
       ├─ correct + FIRST login / NEW device
       │     └─ OTP verification screen (shared design, see specs/otp-verification)
       │          ├─ wrong code → inline error (max 5 attempts)
       │          ├─ resend → new code, 30s cooldown
       │          └─ verified ─┐
       └─ correct + trusted device ────┴──► /dashboard
                                                │
   DASHBOARD (this spec)                        ▼
   ┌─────────────────────────────────────────────────────┐
   │ Header: greeting · bell(badge) · EN placeholder · avatar │
   │ Setup checklist (until done/dismissed)               │
   │ Today's advisory card                                │
   │ Weather snapshot                                     │
   │ Alerts strip (top 3 + view all)                      │
   │ Quick actions (4 × ≥44px)                            │
   │ DETECT CTA — the page's ONE gold moment              │
   │ My farms (cards + add-farm tile)                     │
   └─────────────────────────────────────────────────────┘
   Bottom tabs (mobile): Dashboard · Farms · Advisor · Detect · More
   Sidebar (desktop):    Dashboard · Farms · Advisor · Detect · Prices · Schemes · Notifications · Settings
```

Empty-state branch: first-run farmer (no farms yet) → same shell, welcome hero + "add your first farm" primary CTA + checklist prominent; crop-specific advisory hidden, generic seasonal tip shown instead.
