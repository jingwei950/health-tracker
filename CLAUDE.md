# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Critical: Next.js version

This project runs **Next.js 16.2.3** with **React 19.2.4**. APIs, conventions, and file structure may differ from older Next.js versions in training data. Before writing non-trivial framework code, consult `node_modules/next/dist/docs/` and respect deprecation notices (see `AGENTS.md`).

## Commands

```bash
npm run dev      # start dev server on :3000
npm run build    # production build
npm run lint     # eslint (flat config via eslint-config-next)
npm test         # vitest run (single pass, jsdom)
```

Run a single test file or pattern:

```bash
npx vitest run src/lib/health-track/nutrition.test.ts
npx vitest run -t "parses food response"
```

Tests live alongside sources as `*.test.ts` / `*.test.tsx` and run under jsdom with `@testing-library/jest-dom` matchers (see `vitest.config.ts`, `vitest.setup.ts`). The `@/` alias resolves to `src/` in both Next and Vitest.

## Architecture

Single-page client app backed by one server route.

- **`src/app/page.tsx`** renders `<HealthTrackApp />`. Layout is in `src/app/layout.tsx` (Geist fonts, metadata). Global styles in `src/app/globals.css`; app-specific styles in `src/components/health-track/health-track.css`.
- **`src/components/health-track/health-track-app.tsx`** is the root `"use client"` component and owns **all** app state: goals, food log, activities, sleep, weight/height, and the food-search request lifecycle. Tab panels (`DashboardPanel`, `FoodPanel`, `ActivityPanel`, `SleepPanel`, `BmiPanel`) are pure presentation — they receive state and callbacks as props. When adding features, extend state here rather than introducing context or stores.
- **`src/app/api/food-search/route.ts`** is the only backend surface. It validates the request, calls Anthropic `/v1/messages`, extracts text blocks, and hands the raw text to `parseFoodResponseText` in `src/lib/health-track/parse-food-response.ts`. Errors are mapped to JSON `{ error }` with appropriate status (400/502/503). The client in `health-track-app.tsx` rewrites the `missing ANTHROPIC_API_KEY` message into user-facing setup instructions.
- **`src/lib/health-track/`** holds framework-free logic: `types.ts` (shared shapes — note the terse field names like `cal`/`pro`/`carb`/`fat`/`srv`), `nutrition.ts` (totals/macros math), `parse-food-response.ts` (system prompt + JSON extraction from model output). These are the primary unit-test targets.
- **`src/components/health-track/map-food.ts`** bridges the API shape (`FoodSearchResult`) to the app's `FoodItem` shape. Keep the two shapes decoupled — `FoodSearchResult` mirrors what the model emits, `FoodItem` is what the log stores.
- **`src/components/ui/`** is shadcn output (style `base-nova`, neutral base, lucide icons). Add new primitives via `npx shadcn@latest add <component>`; see `components.json`. Utility `cn()` lives at `src/lib/utils.ts`.

State is intentionally in-memory only — there is no persistence layer. Data resets on refresh; seed data comes from `src/components/health-track/constants.ts`.

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

## Conventions

- Field names across `types.ts` are deliberately short (`cal`, `pro`, `srv`, `tot`, `hr`, ...). Match them when extending types or components rather than renaming.
- Tailwind v4 with `@tailwindcss/postcss`; tokens are defined as CSS variables in `globals.css` and `health-track.css`. Prefer existing tokens over new hex values.
- Server route must never leak the Anthropic key or raw upstream errors longer than 200 chars — follow the pattern already in `route.ts`.
