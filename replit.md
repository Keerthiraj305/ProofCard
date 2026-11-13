# ProofCard

ProofCard turns a student's real project into an evidence-grounded case study and a concise Handshake AI Showcase-ready description.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/proofcard/` — the React/Vite app
- `artifacts/proofcard/src/App.tsx` — project draft, guided writing, and share/preview behavior
- `artifacts/proofcard/src/index.css` — app theme and responsive styles

## Architecture decisions

- Keep the first version frontend-only; drafts are stored in the browser and shared as encoded data in the URL hash.
- Generated writing must only reorganize user-entered facts. Never invent metrics, achievements, or verification.
- No account, AI API key, or backend is required for the core workflow.

## Product

- Guided fields capture a project's problem, personal contribution, tools and AI use, process, validation, impact, limitations, and skills.
- Produces an editable Showcase-ready description and case-study preview.
- Supports demo content, local draft saving, copy/share actions, and a privacy reminder.

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

_Populate as you build — sharp edges, "always run X before Y" rules._

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
