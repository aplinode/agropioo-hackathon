# Implementation Prompt: Farm Profit/Loss Calculator (Feature #7)

You are implementing **Feature #7: Farm Profit/Loss Calculator & Forecast** for the Agropioo platform. Read the spec and plan thoroughly before writing any code. Do not skip steps.

## Required Reading (in order)

1. `specs/profit-loss-calculator/spec.md` — full feature specification with FRs, edge cases, UI requirements, and acceptance criteria
2. `specs/profit-loss-calculator/plan.md` — implementation architecture, file layout, and key decisions
3. `specs/profit-loss-calculator/tasks.md` — task breakdown and acceptance checklist
4. `specs/profit-loss-calculator/research.md` — create this if missing, but check first

Also read these existing files to match the project's exact patterns:
- `db/migrations/0003_farm_records.sql` — migration style
- `lib/validation/farms.ts` — Zod validation pattern
- `lib/auth/guards.ts` — session gating pattern
- `lib/http.ts` — uniform error shape helpers
- `app/api/farms/route.ts` — list/create route pattern
- `app/api/farms/[id]/route.ts` — detail/update/delete route pattern
- `app/api/farms/[id]/archive/route.ts` and `restore/route.ts` — archive/restore pattern
- `app/(farmer)/(dashboard)/crops/comparison-chart.tsx` — SVG chart pattern (do NOT use Recharts; it is not installed)

## Research Requirements BEFORE implementing

### CACP API Research
- The spec says CACP cost projections come from an **external API**. You MUST research the actual CACP (Commission for Agricultural Costs and Prices) data sources.
- Search for: "CACP cost of cultivation API India", "agricultural cost data API Pakistan", "crop cost projection API open source"
- If a public API exists, use it. If not, build a service layer in `lib/cacp/client.ts` with a configurable `CACP_API_URL` env var and a **static fallback dataset** for the 5 main crops (Wheat, Cotton, Sugarcane, Maize, Rice) so the feature works in demo mode.
- Document your findings in `specs/profit-loss-calculator/research.md`.

### Mandi Price Integration Research
- Review `specs/mandi-price-tracker/data-model.md` and `app/api/prices/route.ts` to understand the existing mandi price schema.
- The profit-loss feature should reuse `mandi_prices` data. Study how to query the latest `modal_price` for a crop by district/mandi.
- Do NOT build a new price API; reuse the existing one.

## Implementation Steps (strict order)

1. **Migration**: Create `db/migrations/0014_profit_loss_calculator.sql` with `seasons`, `expenses`, and `projected_costs` tables exactly as specified in the plan.
2. **Validation**: Create `lib/validation/profit-loss.ts` with all Zod schemas.
3. **Calculations**: Create `lib/calculations/profit-loss.ts` with pure functions for P&L, break-even, ROI, variance.
4. **CACP Client**: Create `lib/cacp/client.ts` with researched API endpoint + fallback.
5. **API Routes**: Implement all 7 route files listed in the plan. Every handler must:
   - Call `requireSessionApi()` first
   - Validate input with Zod before any DB query
   - Return uniform `{ error: { code, message } }` shape on failure
   - Scope all queries to `account_id`; return 404 for unauthorized access
6. **UI Pages**: Implement the 3 pages and all shared components.
7. **Charts**: Use **custom SVG** following `comparison-chart.tsx` pattern. Do NOT install Recharts.
8. **Tests**: Write unit tests for calculations and route handlers.
9. **Lint/Build**: Run `npm run lint` and `npm run build` — both must pass.

## Quality Gates (do not skip)

- **Database connectivity**: After migration, use the Neon MCP or `lib/db.ts` to verify tables exist and sample data inserts correctly.
- **API verification**: Test every route with curl/Postman or automated tests. Verify 401/404/422/201/200 responses.
- **Data flow verification**: Create a season via API → verify `projected_costs` are seeded → add an expense → verify variance calculation → mark harvested → verify final P&L.
- **UI verification**: Manually run the app and complete the full user flow: list → create → detail → add expense → harvest → archive/restore.
- **Color audit**: Verify every color in the UI comes from `--color-agro-*` CSS tokens. No inline hex, no Tailwind colors outside the `agro-*` namespace.
- **Accessibility audit**: Touch targets ≥ 44×44px, visible focus rings, `prefers-reduced-motion` respected, no horizontal scroll at 320px.

## Critical Rules

- Do NOT use Recharts. The project uses custom SVG charts.
- Do NOT hardcode the crop list. Fetch from `/api/crops`.
- Do NOT store secrets in code. Use env vars for CACP_API_URL.
- Do NOT use `any` in TypeScript. Zero escapes.
- Do NOT commit until `npm run lint` and `npm run build` pass.
- Do NOT implement features not in the spec. Stay within acceptance criteria.

## Deliverables

1. All code changes committed to the `003-crop-recommendation` branch.
2. `specs/profit-loss-calculator/research.md` with CACP API findings.
3. All acceptance criteria in `tasks.md` checked off.
4. A summary of what was built and any deviations from the spec.

## If You Get Stuck

- Re-read the spec and plan files first.
- Study existing similar features (farms, records, prices) for patterns.
- Search the web for CACP data APIs before asking.
- Ask only after you have exhausted research and codebase study.
