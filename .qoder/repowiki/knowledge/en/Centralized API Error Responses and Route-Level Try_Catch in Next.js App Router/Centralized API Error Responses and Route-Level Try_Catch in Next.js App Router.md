---
kind: error_handling
name: Centralized API Error Responses and Route-Level Try/Catch in Next.js App Router
category: error_handling
scope:
    - '**'
source_files:
    - lib/http.ts
    - lib/auth/copy.ts
    - lib/validation/auth.ts
    - app/api/auth/login/route.ts
    - app/api/auth/forgot-password/route.ts
    - app/api/auth/logout/route.ts
    - app/api/auth/reset/password/route.ts
    - app/global-not-found.tsx
    - app/(site)/[locale]/not-found.tsx
---

## Overview

Agropioo uses a uniform, centralized error-handling approach for its Next.js App Router API routes. Errors are never thrown as untyped exceptions to clients; instead every route handler wraps its body in `try/catch`, logs unexpected failures with `console.error`, and returns a standardized JSON error envelope via helpers in `lib/http.ts`. UI-level routing errors (404s) are handled by Next.js built-in `not-found` files.

## Central HTTP response helpers (`lib/http.ts`)

- `ApiErrorCode` is a strict union type: `"validation_error" | "unauthorized" | "conflict_registered" | "rate_limited" | "server_error"`. This enum-like type is the single source of truth for all API error codes returned to clients.
- `errorBody(code, message)` builds the canonical `{ error: { code, message } }` shape that every failure response follows.
- `errorResponse(code, message, status)` wraps `Response.json(errorBody(...), { status })` so callers never construct error bodies inline.
- `jsonResponse(body, status = 200)` is the symmetric success helper.
- `readJsonBody(request)` safely parses JSON and returns `undefined` on malformed input so Zod validation can turn it into the standard `validation_error` response rather than an unhandled exception.
- `fieldErrorsFrom(issues)` flattens Zod issue arrays into `{ field: message }` maps for client-side field-level feedback.
- `clientIp(request)` extracts the caller IP from `x-forwarded-for` / `x-real-ip` headers (or falls back to `"local"`) — used exclusively for rate-limiting keys, never trusted for auth.

The file header explicitly states the contract: *"failures are always `{ error: { code, message } }` with a proper status."*

## Route-handler pattern (`app/api/auth/*`)

Every auth route follows the same structure:

1. **Input validation** via shared Zod schemas in `lib/validation/auth.ts` (`loginSchema`, `forgotSchema`, `resetPasswordSchema`, `codeSchema`, `signupSchema`). Validation failures return `errorResponse("validation_error", COPY.VALIDATION_FALLBACK, 400)`.
2. **Rate limiting** via `hitLimiter` from `lib/auth/rate-limit` using per-IP and per-email keys derived from `clientIp(request)`. Violations return `errorResponse("rate_limited", COPY.TOO_MANY_ATTEMPTS, 429)`.
3. **Business logic** wrapped in `try/catch`. Any unexpected exception is logged with `console.error("[route]", error instanceof Error ? error.message : error)` and mapped to `errorResponse("server_error", COPY.SERVER_ERROR, 500)`.
4. **Success responses** use `jsonResponse({ ok: true })` or domain-specific payloads like `{ redirect: ... }`.

Examples observed across `login/route.ts`, `forgot-password/route.ts`, `logout/route.ts`, `reset/password/route.ts`, `reset/resend/route.ts`, `reset/verify/route.ts`, `signup/route.ts`, `signup/resend/route.ts`, `signup/verify/route.ts`.

## User-facing copy centralization (`lib/auth/copy.ts`)

All user-visible error messages live in a single `COPY` object (`INVALID_CREDENTIALS`, `TOO_MANY_ATTEMPTS`, `EMAIL_ALREADY_REGISTERED`, `CODE_REJECTED`, `UNAUTHORIZED_GENERIC`, `VALIDATION_FALLBACK`, `SERVER_ERROR`, `DELIVERY_FAILED`). Routes pass these constants to `errorResponse`, ensuring consistent wording and enabling later substitution with DB-driven translations without touching route logic.

## Zod-based validation layer (`lib/validation/auth.ts`)

Validation is declarative and shared between server and client. Schemas normalize inputs (e.g., email is `.trim().toLowerCase()` before any comparison or storage). Each schema carries human-readable messages that feed directly into `fieldErrorsFrom` for per-field client feedback. Cross-field constraints (e.g., password confirmation matching) use Zod's `.refine` with explicit `path` targets.

## UI routing errors (404 handling)

- `app/global-not-found.tsx`: Global 404 page rendered when no route matches at all (e.g. `/xx/features`). It renders its own `<html>` because it sits outside the locale layout tree.
- `app/(site)/[locale]/not-found.tsx`: Locale-aware 404 for unmatched paths under a valid locale prefix. It loads the current locale via `next/root-params`, fetches localized strings through `getDictionary(current)`, and handles RTL fallback isolation for English fallback text.

Both pages render a styled 404 with a link back to home.

## Conventions and constraints observed

- **No custom error classes**: The codebase does not define domain-specific `Error` subclasses; errors are represented as typed string codes plus messages.
- **No `throw` to clients**: Route handlers never `throw` to the framework; they catch internally and return `Response` objects.
- **Uniform error envelope**: All API failures conform to `{ error: { code, message } }`; clients can rely on this shape.
- **Strict code set**: Only the five values in `ApiErrorCode` are used; adding a new code requires updating the union type, which acts as a compile-time constraint.
- **User messages isolated from internals**: `COPY` constants keep user-facing text out of route logic; internal stack traces go only to `console.error`.
- **Rate limiting is part of error flow**: Rate-limited requests are treated as first-class error cases returning `429 rate_limited`, not silently dropped.
- **Zod is the single validation boundary**: Input parsing happens once via `safeParse`; invalid input never reaches downstream logic.
- **Next.js routing errors are handled declaratively** via `not-found.tsx` files rather than middleware or try/catch.