# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # local development server
npm run build    # production build (requires valid Supabase URL in .env.local)
npm run start    # start production server
```

No test runner is configured.

## Architecture Overview

This is a **Next.js 16 (App Router)** mindmap editor with Supabase auth/DB, deployed to Vercel. Users write markdown in a CodeMirror editor; the markmap library renders it as an interactive SVG mindmap.

### Route protection: `src/proxy.ts`

Next.js 16 uses `proxy.ts` (not `middleware.ts`) and exports a `proxy` function (not `middleware`). This file handles auth redirects: unauthenticated users hitting `/app` or `/admin` are sent to `/auth`; admin-only routes check the `profiles.role` column.

### Supabase clients

- `src/lib/supabase/client.ts` — browser client (`createBrowserClient`)
- `src/lib/supabase/server.ts` — server client (`createClient`) + service-role admin client (`createAdminClient`) for server components and API routes
- Both use placeholder fallback strings so the build doesn't fail without `.env.local`; `createBrowserClient`/`createServerClient` take no generic type parameters (using them caused `never` type issues)

### Main editor: `src/app/app/page.tsx`

The single-page editor is a client component (`'use client'` + `export const dynamic = 'force-dynamic'`) with a 3-panel layout managed via controlled widths:
- **LeftPanel** — project list sidebar (collapsible to icon strip), handles project CRUD directly via Supabase client
- **MiddlePanel** — markdown editor toolbar + CodeMirror; saves via Supabase client; `Cmd/Ctrl+S` shortcut
- **RightPanel** — markmap SVG preview + export/share overlays

State flows top-down from `AppPage`: content, project selection, and panel widths all live there.

### Browser-only components

**Both `CodeMirrorEditor` and `MarkmapRenderer` must be imported with `next/dynamic` + `{ ssr: false }`** — they use browser APIs unavailable during SSR. They are dynamically imported in every file that uses them (MiddlePanel, RightPanel, AdminClient, ShareView).

### MarkmapRenderer (`src/components/mindmap/MarkmapRenderer.tsx`)

Two `useEffect`s: the first (empty deps) creates the `Markmap` instance; the second (deps `[content]`) calls `setData` + `fit` on updates. The `svgRef` can be passed in from the parent for export operations.

### Auth flow

Email/password only, restricted to `@fpt.com` domain (enforced in both `src/app/auth/page.tsx` and `src/app/api/admin/users/route.ts`). The `ALLOWED_DOMAIN` constant appears in both files and must be kept in sync. Callback route at `src/app/auth/callback/route.ts` exchanges the code for a session; invited users land at `/auth/set-password`.

### Admin panel: `src/app/admin/`

- `page.tsx` — server component that fetches template + users + groups, passes to `AdminClient`
- `AdminClient.tsx` — client component with three tabs: Template editor, Users table (invite/delete/alias), Teams (groups + members)
- Admin operations use API routes that re-verify the caller's `admin` role server-side

### API routes

All admin API routes (`/api/admin/*`) use the same pattern: verify session + `admin` role, then use the service-role key for privileged Supabase operations.

- `POST /api/admin/users` — invite user via `adminClient.auth.admin.inviteUserByEmail`
- `DELETE /api/admin/users` — delete user via service role (cannot delete self)
- `PATCH /api/admin/users` — update alias
- `POST/DELETE /api/admin/template` — CRUD the single global template row
- `POST/DELETE /api/admin/groups` — create/delete user groups
- `POST/DELETE /api/admin/groups/members` — add/remove group members

### Export: `src/lib/export.ts`

`exportPNG` uses a canvas at 2× scale with a white background. It serializes the SVG via `encodeURIComponent` data URL (more reliable than blob URL for SVG→canvas cross-browser). `exportSVG` uses `XMLSerializer` directly.

### Sharing

Each project has a pre-generated `share_token` UUID. Toggling `is_shared` on a project exposes it at `/share/[token]` — a public read-only page requiring no auth.

### DB types: `src/types/database.ts`

Manual types — no generated Supabase types. Types: `Profile`, `Project`, `Template`, `UserGroup`, `GroupMember`. The `Database` type shape is defined for documentation but not passed as a generic to Supabase clients.

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

## Initial Setup

1. Add real Supabase credentials to `.env.local`
2. Run `supabase/schema.sql` in the Supabase SQL editor
3. Promote an admin: `UPDATE public.profiles SET role = 'admin' WHERE email = 'your@email.com';`
4. Configure email auth in Supabase → Auth → Providers (restrict to `fpt.com` domain in SMTP settings or rely on app-level enforcement)
