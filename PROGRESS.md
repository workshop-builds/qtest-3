# Progress

One entry per work session: date, model, what changed, what is next.

## 2026-10-08: Opening session (claude-opus-5-5)

What changed:
- Read PROJECT.md (Pixel Badge, a static in-browser pixel-art badge maker) and found that it fits the safety perimeter as written. No alternative was needed; see DECISIONS.md for the guardrails later sessions must keep (no runtime network calls, no wallet, no financial claims).
- Wrote BLUEPRINT.md (product, audience, principles, shape of v1, data model) and PLAN.md (6 milestones with verifiable acceptance criteria).
- Set up the stack: Vite 8, React 19, TypeScript, Tailwind CSS 4 (`@tailwindcss/vite`), Vitest 5 + Testing Library (jsdom). `package-lock.json` is committed for the platform's `npm ci && npm run build`. Output goes to `dist/`.
- First page: the project page (`src/App.tsx`), with the name, what the product will be, and the plan read at build time from PLAN.md (`src/plan.ts`).
- Tests: `src/App.test.tsx` (plan parser, PLAN.md milestones numbered from 1, page shows name, description and every milestone). `npm test` passes 3/3, and `npm run build` passes after a clean `npm ci`.

Not started: Milestone 1.

Next: Milestone 1, the drawing grid and palette.
