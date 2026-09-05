# Global AGENTS.md — Universal Instructions & Preferred Stack

Instructions for any AI coding agent (Antigravity, Cursor, Claude Code, Cline, etc.) — and humans. Read this before writing or moving any code.

> **Stack Flexibility**: When working on projects using a different stack or framework (e.g. Next.js, Python/FastAPI, Go, Flutter, etc.), adapt the stack-specific libraries accordingly, but **always strictly enforce** the core code quality bar (no AI slop, senior human engineer style), readability, strict typing, security, and architectural boundaries.

---

## 1. Stack Summary (Default / Preferred Fullstack)

| Layer | Choice |
|---|---|
| Monorepo runner | Turborepo |
| Package manager | Bun |
| Frontend | TanStack Router + Vite, React |
| UI | shadcn/ui (Radix base, "nova" style, Tabler icons, neutral theme/base, Inter font, default radius) + Tailwind |
| State (client) | Zustand |
| State (server/cache) | TanStack Query |
| HTTP client | Axios (wrapped, never used raw in components) |
| Tables | TanStack Table |
| Forms | React Hook Form + Zod resolvers |
| Backend | Hono on Bun runtime |
| Auth | better-auth (organizations plugin) |
| Database | PostgreSQL via Prisma |
| Job queue | BullMQ |
| Email | Resend + React Email |
| File storage | Cloudinary |
| Testing | Vitest |
| Dev environment | Devcontainer + Docker Compose |
| CI | GitHub Actions |
| Deploy | Docker (web + server) |

Not included yet (add later via proper modular additions rather than hand-rolling): caching, logging, observability, rate limiting, bot protection, i18n, search, vector DB, feature flags, realtime, CMS, ecommerce.

---

## 2. Monorepo Structure

```
.
├── apps/
│   ├── server/                  # Hono API — Bun runtime
│   │   └── src/
│   │       ├── config/          # service/client init (redis, cloudinary, resend, bullmq) — reads validated env from packages/env
│   │       ├── controllers/     # request handlers — business logic entry points, called by routes
│   │       ├── jobs/            # BullMQ producers (enqueue) + processors (worker), one subfolder per queue
│   │       ├── middlewares/     # auth guard, error-handler, request logging, etc.
│   │       ├── routes/          # Hono route definitions — thin, delegate to controllers
│   │       ├── scripts/         # one-off/maintenance scripts (seed, backfill, cron triggers)
│   │       ├── services/        # business/integration logic — email (Resend), storage (Cloudinary), external APIs
│   │       ├── tests/           # test suite — mirrors the folders above (tests/controllers, tests/services, ...)
│   │       ├── types/           # server-only shared types/interfaces
│   │       ├── utils/           # pure helpers — api-response.ts, formatting, etc.
│   │       ├── validators/      # Zod request schemas, one file per resource
│   │       ├── app.ts           # Hono app instance + middleware/route registration (no listen())
│   │       └── index.ts         # entry point — imports app from app.ts, starts the server
│   │       # NOTE: no db/ or models/ here — the Prisma schema and client live in packages/db (§10),
│   │       # imported into controllers/services via the shared @repo/db package.
│   └── web/                     # TanStack Router frontend — Vite
│       └── src/
│           ├── components/
│           │   ├── ui/          # shadcn/ui primitives — GENERATED, do not hand-edit
│           │   └── *.tsx        # your feature/shared components
│           ├── lib/              # auth-client.ts, http-client.ts (axios), utils.ts (cn helper)
│           ├── routes/           # file-based routes — filename = URL
│           ├── main.tsx
│           └── index.css
├── packages/
│   ├── auth/             # better-auth-organizations server config, shared between apps
│   ├── config/           # shared tsconfig.base.json — extend, don't duplicate compiler options
│   ├── db/                # Prisma client + schema
│   │   └── prisma/schema/
│   │       ├── schema.prisma   # app models
│   │       └── auth.prisma     # auth models (owned by better-auth generator — don't hand-edit)
│   └── env/               # typed, validated env vars: server.ts, web.ts, native.ts
├── .devcontainer/
├── .github/workflows/ci.yml
├── docker-compose.yml
├── turbo.json
└── package.json
```

---

## 3. Where New Code Goes

| I need to add... | Goes in |
|---|---|
| A new page/URL | `apps/web/src/routes/` (new file = new route) |
| A reusable UI primitive (button variant, etc.) | Prefer adding via shadcn CLI, output lands in `apps/web/src/components/ui/` |
| A feature component (form, panel, card) | `apps/web/src/components/` |
| Client-side global state (UI toggles, filters, wizard steps) | New Zustand store in `apps/web/src/stores/<domain>.ts` (one store per domain, never one giant store) |
| Server data / cache | TanStack Query hook in `apps/web/src/hooks/use-<resource>.ts`, calling `lib/http-client.ts` — never fetch server data directly in a component |
| A new API route | `apps/server/src/routes/<resource>.ts` (path + wiring only), mounted in `app.ts` |
| The logic behind an API route | `apps/server/src/controllers/<resource>.controller.ts` — called by the route, never inlined in the route file |
| Request/body validation (server) | `apps/server/src/validators/<resource>.validator.ts` — Zod schema, used by the controller before touching business logic |
| Business/integration logic (email, storage, 3rd-party calls) | `apps/server/src/services/<name>.service.ts` |
| Custom Hono middleware (auth guard, error handler, logging) | `apps/server/src/middlewares/` |
| A background job | Producer + processor in `apps/server/src/jobs/<queue-name>/` |
| A one-off/maintenance script | `apps/server/src/scripts/` |
| A server-only shared type | `apps/server/src/types/` |
| A DB model | `packages/db/prisma/schema/schema.prisma`, then run the migration workflow — **not** in `apps/server` |
| A shared type used by both apps | `packages/db` (if derived from Prisma) or a new `packages/shared` package — never duplicate types across `apps/web` and `apps/server` |
| An env var | `packages/env/src/{server,web,native}.ts` with a Zod schema — never read `process.env` / `import.meta.env` directly in app code |

---

## 4. TypeScript & Naming Standards

- **Strict mode always on.** No `any`; use `unknown` + narrowing if the type is genuinely unknown.
- Prefer `type` for object shapes and unions; use `interface` only when you need declaration merging.
- **Files:** kebab-case (`user-menu.tsx`, `use-auth.ts`).
- **Components:** PascalCase named exports — avoid default exports except for route files (TanStack Router expects them) and `apps/web/src/main.tsx`.
- **Hooks:** `use-*.ts`, one hook per file when it exceeds ~30 lines.
- **Booleans:** prefix `is`/`has`/`should` (`isLoading`, `hasError`).
- Import shared workspace packages via their package name (`@repo/db`, `@repo/env`, `@repo/auth`), never via relative `../../../packages/...` paths.
- Run `bunx tsc --noEmit` before considering a task done — don't let type errors slide because dev server didn't complain.

---

## 5. Code Quality & Style — Senior Human Engineer, Zero "AI Slop"

Low tolerance for "AI slop": bloated comments, needless abstraction, defensive code nobody asked for. Follow these rules exactly.

### Structure
- Small, focused functions — one function, one responsibility.
- Small, reusable UI components — no monolithic components that render half a page.
- If a function or component is getting long, or doing more than one job, split it **before** finishing the task — not as a follow-up.

### Readability (Highest-Priority Quality Bar)
- Code should read like plain English — clear names beat clever code, every time.
- Prefer explicit over implicit; make intent obvious at the call site (`createOrgInvite(orgId, email)`, not a config object nobody can read without opening the function).
- Avoid deeply nested logic — extract conditions into named variables or early returns instead of a 4-level-deep `if`.
- No abbreviations in names unless universally understood (`id`, `url`, `db`). Spell out everything else (`req`/`res` in Hono handler signatures are the accepted exception).

### Comments
- Comments explain **why**, never **what**. If a comment just restates the line below it in English, delete it.
- No step-by-step narration (`// step 1: fetch user`, `// now validate`, `// finally return`). Structure the code instead of narrating it.
- No decorative section banners (`// ==== Helpers ====`) unless a file is genuinely long enough to need navigation — and even then, prefer splitting the file.
- JSDoc only on real public API surface — exported functions/types from a `packages/*` consumed by other apps. Not on every internal helper or controller.
- One short line max for non-obvious reasoning (a workaround, a business rule that isn't self-evident). Anything longer belongs in a PR description, not a comment block.
- Don't narrate your own diff (`// added this`, `// fix: ...`) — that's what git history is for.
- No emoji in code comments, commit messages, or log messages.
- Prefer a better name over a comment: `activeOrgMembers` beats `members // only active ones in this org`.

### SOLID
- **Single responsibility** — every function/class/component does one thing. If describing it needs "and," split it.
- **Open/closed** — extend behavior via composition (a new component, a new function, a new case) rather than editing a working function to bolt on an unrelated branch.
- **Liskov substitution** — a shared component/type variant must work anywhere its base type is expected, with no surprising behavior swap.
- **Interface segregation** — don't hand a component or function a big shared props/type object it only uses part of; give it exactly what it needs.
- **Dependency inversion** — controllers and components depend on a service/hook interface, not a concrete SDK call, so an implementation (e.g. Cloudinary → S3) can change without touching every caller.

### Reusability & abstraction
- Don't extract a helper, hook, or shared component until the logic is genuinely needed a **second time**. One-off logic stays inline — a little duplication beats a premature, wrong abstraction.
- Don't add config options, generic parameters, or "flexibility" for hypothetical future use cases nobody asked for. Build for the current requirement.
- Don't wrap code in `try/catch` "just in case." Only catch where you can meaningfully handle or translate the error; let everything else bubble up to the global error-handler middleware (backend) or an error boundary (frontend).
- When editing existing code, match the file's existing patterns over introducing a "better" one you prefer — consistency beats a local rewrite.

### What to avoid (non-negotiable)
- No `any` types.
- No commented-out dead code — delete it, git history remembers it.
- No `console.log` left in committed code.
- No premature abstraction — wait until a pattern repeats at least twice.
- No features, options, or edge-case handling beyond what was actually asked for in the task.

---

## 6. Frontend Conventions

- **Routing:** one route = one file in `apps/web/src/routes/`. Keep route files thin — they compose components, they don't contain business logic.
- **shadcn/ui:** treat `components/ui/` as vendored/generated code. To customize, wrap the primitive in your own component rather than editing the generated file directly.
- **Styling:** Tailwind utility classes only. Use the `cn()` helper from `lib/utils.ts` for conditional classes. No inline `style={{}}` unless the value is truly dynamic/computed.
- **State split:**
  - Server state (anything from the API) → TanStack Query.
  - Ephemeral client/UI state → local `useState`.
  - Cross-component client state → Zustand, scoped to one store per domain.
  - Never mirror TanStack Query data into a Zustand store — read it directly from the query hook.
- **Data fetching:** all HTTP calls go through `lib/http-client.ts` (shared Axios instance with base URL/interceptors). Wrap each call in a TanStack Query hook. No `axios.get(...)` scattered inside components.
- **Forms:** React Hook Form + `zodResolver`. Define the Zod schema next to the form (or in a co-located `*.schema.ts` file) and infer the form type from it with `z.infer<typeof schema>` — don't hand-write a parallel type.
- **Animation:** Framer Motion for meaningful transitions (page/modal enter-exit, list reordering) — not for decoration on every element.

---

## 7. Backend Conventions (Hono/Bun)

Layering, in order of a request's flow: **route → validator → controller → service**. Never skip a layer or reach backward.

- **`routes/`** — path + HTTP method wiring only (`router.post('/orgs/:id/members', validate(addMemberSchema), addMemberController)`). No logic here.
- **`validators/`** — one Zod schema file per resource (`user.validator.ts`, `org.validator.ts`). Applied as middleware on the route before the controller runs.
- **`controllers/`** — read validated input, call relevant service(s), shape response via `utils/api-response.ts`, return. Orchestrate only; no business rules in controllers.
- **`services/`** — where business/integration logic lives: `@repo/db` (Prisma), Resend, Cloudinary, external APIs. Services are the only layer allowed to import `@repo/db` directly.
- **`middlewares/`** — cross-cutting concerns: global error handler, auth/session guard (`packages/auth`), request logging.
- **`jobs/`** — BullMQ. Each queue gets its own subfolder with a producer (to enqueue) and processor (worker function). Long-running or non-critical work (emails, exports, notifications) always goes through a job — never awaited inline.
- **`config/`** — third-party clients instantiated once and exported (Redis connection for BullMQ, Cloudinary SDK, Resend client), reading validated values from `packages/env`.
- Transactional emails are React Email templates (co-located under `services/email/templates/`), sent through the email service.
- Every response goes through `utils/api-response.ts` — single consistent success/error envelope.
- Every thrown error is a typed error (`NotFoundError`, `ValidationError`) caught by the global error-handler middleware.

---

## 8. Auth, Security & Database

### Auth
- All auth config lives in `packages/auth` and is consumed by both apps.
- Organizations plugin: most resources belong to an org, not a user. Default to scoping by `organizationId` and check membership/role before returning data.
- Frontend auth state comes from `apps/web/src/lib/auth-client.ts` — use its hooks, don't parse cookies/tokens manually.

### Security
- **Never trust user input**: Validate at every boundary (backend validators + frontend form schemas).
- **Never expose secrets**: API keys, DB URLs, and tokens only in `packages/env/src/server.ts` (or `.env`, gitignored) — never in client bundles, never logged.
- **Sanitize before rendering**: Don't defeat React escaping with `dangerouslySetInnerHTML` on unsanitized input.
- **Parameterized queries only**: Prisma does this by default. Never concatenate raw SQL strings.
- **Authorization on the backend**: Every controller must check membership/role before returning or mutating data.

### Database (Prisma + Postgres)
- `schema.prisma` is for app models. `auth.prisma` is owned by the better-auth generator — do not hand-edit.
- Workflow for schema change:
  1. Edit `packages/db/prisma/schema/schema.prisma`.
  2. `bunx prisma migrate dev --name <change>` from `packages/db`.
  3. Commit the generated migration folder.
- Never import `@prisma/client` directly in route files — go through `packages/db`'s exported client.
- Add an index on any column regularly filtered, sorted, or joined on.

---

## 9. Environment, Performance, Testing & Git

### Environment Variables
- Add new vars to the Zod schema in `packages/env/src/{server,web,native}.ts`.
- `server.ts` vars are never bundled into the frontend.

### Performance
- Memoize only for a measured reason.
- Lazy-load heavy routes via TanStack Router code-splitting.
- Keep expensive work off the render path and off the main thread (enqueue jobs, use workers).
- Paginate or virtualize large lists (TanStack Table/Virtual).

### Testing (Vitest)
- **Frontend (`apps/web`)**: Co-locate tests (`foo.ts` → `foo.test.ts`).
- **Backend (`apps/server`)**: Mirror under `src/tests/` (`tests/controllers/user.controller.test.ts`).
- Unit-test services and jobs processors directly (mock external SDKs). Test routes end-to-end through the Hono app instance.
- Run `bun test` or `turbo test` before pushing.

### Git & Commits
- Conventional Commits: `feat:`, `fix:`, `chore:`, `refactor:`, `test:`, `docs:`.
- Branch naming: `feat/<short-desc>`, `fix/<short-desc>`.
- Never commit `.env`, generated Prisma client, or `.turbo`/`node_modules`.

---

## 10. Hard Don'ts

- Don't hand-edit `components/ui/*` or `auth.prisma`.
- Don't call `fetch`/`axios` directly from a component — go through TanStack Query hook + `http-client.ts`.
- Don't read `process.env` outside `packages/env`.
- Don't put business logic in route files.
- Don't add a new top-level dependency if an existing library in the stack already covers it.
- Don't skip the BullMQ queue for email/third-party/heavy work.
- Don't write AI slop comments, premature abstractions, or unrequested flexibility.
