---
kind: dependency_management
name: npm-based dependency management with lockfiles and skill registry
category: dependency_management
scope:
    - '**'
source_files:
    - package.json
    - package-lock.json
    - .opencode/package.json
    - .opencode/package-lock.json
    - skills-lock.json
---

## System / Approach

The repository uses **npm** as the sole package manager for Node.js/JavaScript dependencies, declared in a single root `package.json`. A `package-lock.json` (lockfileVersion 3) is committed alongside it, pinning every transitive dependency to an exact version and integrity hash so installs are reproducible. There is no vendoring of JS libraries; all third-party code is fetched from the public npm registry (`https://registry.npmjs.org`).

A second, separate npm workspace lives under `.opencode/`, which has its own `package.json` and `package-lock.json` — this is an isolated tooling dependency tree used by the OpenCode editor/skills layer and is not part of the application build.

For AI "skills" (documentation bundles consumed by Claude/Claude Code), the repo uses a dedicated `skills-lock.json` that pins skills sourced from GitHub repositories (`anthropics/skills`, `nutlope/hallmark`, `nextlevelbuilder/ui-ux-pro-max-skill`) via their `sourceType: github` entries and a `computedHash` per skill, providing deterministic resolution of those non-npm assets.

## Key Files

- `package.json` — declares runtime dependencies (`next`, `react`, `@supabase/supabase-js`, `jose`, `bcryptjs`, `nodemailer`, `zod`, `react-hook-form`, `@hookform/resolvers`) and dev dependencies (`typescript`, `eslint`, `vitest`, `tailwindcss`, `@tailwindcss/postcss`, `@types/*`). Versions use caret ranges (`^x.y.z`) for minor/patch flexibility while keeping major versions pinned where appropriate (e.g. `next: 16.3.2`, `react: 19.2.8`).
- `package-lock.json` — full lockfile for the root project; ensures deterministic builds across environments.
- `.opencode/package.json` + `.opencode/package-lock.json` — isolated dependency tree for the OpenCode tooling layer.
- `skills-lock.json` — pins AI skill packages from GitHub sources with computed hashes.

## Architecture & Conventions

- **Single-root monorepo**: All application code shares one `package.json`; there are no per-package manifests or workspaces configured.
- **Version strategy**: Runtime deps use caret ranges for patch/minor updates (e.g. `^5.9.1`, `^2.112.3`), while framework-level packages like `next` and `react` are pinned to exact versions to avoid breaking changes. Dev tooling similarly uses caret ranges.
- **Lockfile-first**: The committed `package-lock.json` is the source of truth for installed versions; developers should regenerate it via `npm install` rather than hand-editing.
- **No private registries or scoped packages**: No `.npmrc`, no `@agropioo/*` scope, no `GOPRIVATE` equivalents — all packages resolve against the public npm registry.
- **No vendoring**: Dependencies are never checked into `node_modules/`; only the lockfile is versioned.
- **Separation of concerns**: Tooling/editor dependencies under `.opencode/` are fully decoupled from the app's dependency graph.

## Conventions & Constraints

- Dependencies are added through npm (implied by the presence of `package.json` + `package-lock.json`); no other package managers (yarn, pnpm, bun) are configured.
- Third-party packages must be resolvable from the public npm registry unless a custom registry is explicitly configured elsewhere (none found).
- Skill assets are managed separately via `skills-lock.json` with `computedHash` verification, ensuring skill content cannot drift without updating the lock entry.
- Scripts in `package.json` (`dev`, `build`, `start`, `lint`, `test`, `sync:translations`) are the canonical entry points; any new dependency intended for CI/build/test should go under `devDependencies`, runtime-only deps under `dependencies`.