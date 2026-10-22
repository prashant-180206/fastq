# FastQ

Skip the wait. QuiLess lets businesses run **queues** and **appointments** in one place, and lets customers join a queue or book a slot in a few taps — from QR code to check-in.

## Overview

- **Customers** discover businesses, view services and daily availability, join a queue (token), or book an appointment with a service slot.
- **Business owners** manage their business profile, hours, services, queues, live queue operations (call-next, check-in, skip, no-show, expiry), and appointments (bookings, check-in, complete, no-show).
- Token lifecycle is fully tracked (waiting → called → checked in → serving → completed, plus cancelled/skipped/expired/no-show), with grace-period deadlines and hard validity expiry.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Next.js 16.4 (App Router, Turbopack, React 19) |
| Backend / realtime | Convex (queries, mutations, live subscriptions, auth tables) |
| Auth | `@convex-dev/auth` (password flow), Convex Auth middleware in `src/proxy.ts` |
| UI | Tailwind CSS v4, Base UI (`@base-ui/react`), shadcn (`components.json`) |
| Icons | HugeIcons (`@hugeicons/core-free-icons` + `@hugeicons/react`) |
| QR code | `qrcode.react` (render) + `html5-qrcode` (scan, business check-in) |
| Maps | `leaflet` + `react-leaflet` |
| Package manager | pnpm (`pnpm-workspace.yaml`) |

## Features

- **Business profile**: onboarding, weekly operating hours, business type (business / government office / restaurant / salon / other), optional WGS84 coordinates, contact details, public page at `/b/[businessId]`.
- **Services**: per-service duration, queue- and/or appointment-enabled flags, active/inactive state.
- **Queues**: prerequisites with acknowledgements, grace period, daily capacity model shared with appointments.
- **Live queue ops**: call next, check-in (window + QR scan), start serving, complete, skip, cancel, no-show, expiry sweeps.
- **Appointments**: slot availability (IST), booking, cancel, check-in, complete, no-show.
- **Customer account**: dashboard summary, my tokens, my appointments, all live updates via Convex subscriptions.
- **Find by QR**: customers can scan a business QR code from the customer home to open its public page directly.
- **Business search**: debounced keyword + business-type filter, radius-based bounding-box geo search via `convex/lib/geo.ts` (updated per major library), live location with `use-debounce`, results on a Leaflet map at `/customer/map` and paginated "load more" lists.
- **Theming**: dark/light/system via `next-themes`.

## Quick start

See [docs/getting-started.md](docs/getting-started.md) for the full setup.

```bash
pnpm install

# 1. Set up a Convex deployment and copy the URLs into .env.local
#    CONVEX_DEPLOYMENT, NEXT_PUBLIC_CONVEX_URL, NEXT_PUBLIC_CONVEX_SITE_URL
pnpm convex dev                      # run the Convex backend (separate terminal)

pnpm dev                             # run the Next.js dev server
```

Open http://localhost:3000 — sign up, create a business, and try the customer flows on a second account.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Next.js dev server (Turbopack) |
| `pnpm convex dev` | Convex local backend with file watch |
| `pnpm lint` | ESLint (flat config, `eslint.config.mjs`) |
| `pnpm build` | Production build |
| `pnpm start` | Serve the production build |
| `pnpm convex deploy` | Push schema/functions to the configured deployment |

> WSL note: if the dev server was started with `pnpm.exe` (Windows) you may reach it via the WSL gateway IP (e.g. `http://172.24.64.1:3000`) rather than `localhost`.

## Environment variables

See `.env.local` (not committed). Required keys:

| Variable | Purpose |
| --- | --- |
| `CONVEX_DEPLOYMENT` | Convex deployment identifier |
| `NEXT_PUBLIC_CONVEX_URL` | Convex HTTP endpoint used by the client |
| `NEXT_PUBLIC_CONVEX_SITE_URL` | Convex site URL (e.g. QR asset / file URLs) |
| `SETUP_SCRIPT_RAN` | One-time setup marker used by the bootstrap script |

Never commit secrets. Auth is configured under `convex/auth.config.ts`.

## Project structure

```
src/
  app/
    page.tsx                # public landing page
    (auth)                  # sign-in, sign-up
    customer/               # customer routes + shared layout (AppHeader)
      page.tsx              # discover businesses (home)
      dashboard/
      queue/                # my tokens, token detail
      appointments/         # my appointments, detail
    business/               # owner dashboard + sidebar layout
      [businessId]/         # overview, services, queues (+ live ops),
                            #   appointments, schedule, working hours
    b/[businessId]/         # public business page (join queue / book)
  components/               # ui/ (shadcn + Base UI), layout/, business/, customer/
  hooks/                    # use-mobile, use-now, ConvexProvider
  lib/                      # format (IST), toast, utils
  proxy.ts                  # convex-auth middleware (route protection)
convex/                     # schema, auth, business queries/mutations
docs/                       # project documentation
```

## Documentation

- [Getting started](docs/getting-started.md) — prerequisites, environment, running the stack, verification.
- [Architecture](docs/architecture.md) — routing, middleware, auth, layouts, UI conventions.
- [Data model & Convex API](docs/convex-data-model.md) — tables, relationships, exported queries/mutations.
- [Contributing](docs/contributing.md) — code style, lint/typecheck rules, workflow.
