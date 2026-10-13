# Getting started

## Prerequisites

- **Node.js 20+** (Next.js 16 requirement)
- **pnpm** (the repo is a pnpm workspace; `pnpm-lock.yaml` + `pnpm-workspace.yaml`)
- A **Convex account** (`pnpm add -g convex` or run via `pnpm convex`)

## 1. Install dependencies

```bash
pnpm install
```

## 2. Set up Convex

Create a project and get your three environment values:

```bash
pnpm convex deploy                              # interactive: creates a deployment
pnpm convex env add                             # add values to your deployment
```

Copy the generated URLs into `.env.local` (same directory as `next.config.ts`):

```
CONVEX_DEPLOYMENT=<deployment name>
NEXT_PUBLIC_CONVEX_URL=<https://...convex.cloud>
NEXT_PUBLIC_CONVEX_SITE_URL=<https://....convex.site>
```

`NEXT_PUBLIC_CONVEX_SITE_URL` is required for serving generated QR/file assets (see `convex/http.ts`). Auth config lives in `convex/auth.config.ts` — the password provider does not need external settings.

## 3. Run the stack

Terminal 1 — Convex backend (watches mutations/queries/schema):

```bash
pnpm convex dev
```

Terminal 2 — Next.js dev server:

```bash
pnpm dev
```

Open http://localhost:3000. Sign up, create a business from the dashboard ("My businesses" → "Add your business"), then open the public page and test joining a queue / booking an appointment from a second account.

## WSL note

If the Next dev server was launched through `pnpm.exe` (Windows binary), Windows hosts it on its own loopback. From WSL it is usually reachable at the gateway IP instead of `localhost`:

```bash
GW=$(ip route | awk '/default/ {print $3; exit}')
curl -I "http://$GW:3000"
```

## Verification

Typecheck and lint are the project gates — both must be clean before committing:

```bash
pnpm eslint src                    # or: pnpm lint
pnpm exec tsc --noEmit             # project-wide type check
```

If `node` is not on the PATH in this WSL shell, invoke the Windows binary explicitly, e.g.:

```bash
"/mnt/c/Program Files/nodejs/node.exe" node_modules/typescript/bin/tsc --noEmit
"/mnt/c/Program Files/nodejs/node.exe" node_modules/eslint/bin/eslint.js src
```

`next build` runs these plus a production render; the app is fully dynamic (all routes render at request time), so it must be run against a reachable Convex deployment.