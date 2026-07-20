<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## Objective
- Build a web-based AI image generation tool using APIB.ai GPT-Image-2 API, supporting text-to-image, image-to-image, parallel multi-task generation, database-backed history, user auth, and admin management.

## Important Details
- **Tech stack**: Next.js 16 (App Router), TypeScript, TailwindCSS v4, Zustand + persist, shadcn/ui, Prisma + SQLite, NextAuth.js v5, Zod
- **API base**: `https://api.apib.ai/v1`, proxied via `/api/generate`, `/api/tasks/[taskId]`
- **Env vars**: `APIB_API_KEY`, `DATABASE_URL="file:./dev.db"`, `AUTH_SECRET`
- **Layout**: `max-w-6xl mx-auto px-6 py-6`, flex-col/row responsive, scroll container
- **Image storage**: `private/uploads/`, served via `/api/images/[id]` with auth, 50 max auto-cleanup
- **Auth**: NextAuth v5 Credentials, JWT, admin seed via `/api/auth/seed`
- **History**: DB-backed `/api/history` CRUD, 10 per user, delete per entry
- **Dark mode**: light/dark/system toggle via zustand persist
- **Toast**: lightweight, reused across generate/delete/reuse prompt/add ref

## Build
- `npm run build` — passes with 0 errors, 4 lint warnings (img elements)
- `npm run lint` — 0 errors

## Git
- remote: `origin` → `git@github.com:danroudao/ai-image-gen.git`
- committed: v0.1 (initial), v0.2 (parallel gen), v0.3 (UI polish), v0.4 (DB), v0.5 (auth+admin)
- **Blocked**: (none)
- **Last commit**: `5c71298` — feat: user settings, admin system config, quota reset (v0.6.0)[pushed]

## Todos
- (none — all stages complete and pushed)
