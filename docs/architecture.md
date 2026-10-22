# Architecture

## Stack summary

Next.js 16.4 App Router with Turbopack and React 19, Tailwind v4, Base UI (`@base-ui/react`), shadcn-compatible components, and Convex (`@convex-dev/auth` + `convex/react`) for the realtime backend. All app data lives in the browser via Convex live subscriptions; there is no page-level data fetching layer.

## Routing

```
/                    public landing
/sign-in, /sign-up   auth pages (redirect to /customer when signed in)
/customer            customer home (discover businesses)  — protected
/customer/dashboard  customer account summary            — protected
/customer/queue      my queue tokens (+ /queue/[tokenId]) — protected
/customer/appointments  my appointments (+ /[appointmentId]) — protected
/business            owner dashboard (+ /business/new)    — protected
/business/[businessId]/… overview, services, queues (incl. live ops),
                       appointments, schedule, working-hours — protected
/b/[businessId]      public business page (join queue / book) — public
```

Key notes:

- Params are **Promises**: client pages use `use(params)` (`params: Promise<{ id: string }>`). Never access `params.x` synchronously.
- `src/app/customer/layout.tsx` and `src/app/business/[businessId]/layout.tsx` provide the shared `AppHeader` / sidebar shells for their route trees.
- Every route is client-rendered; pages read Convex state through hooks.

## Auth & middleware

- `src/proxy.ts` exports the Convex Auth Next.js middleware. It protects `/business(.*)`, `/customer(.*)`, `/cb(.*)`, and redirects signed-in users away from `/sign-in` and `/sign-up` to `/customer`.
- `convex/auth.ts` + `convex/auth.config.ts` define the providers (password-based).
- Auth tables are injected into the schema via `authTables` from `@convex-dev/auth/server` (see `convex/schema.ts`).

## Dynamic rendering policy

Next 16 with `experimental.cacheComponents` rejects clock access during static prerender (`blocking-prerender-current-time` / `blocking-prerender-dynamic`). The app is deliberately fully dynamic:

- `src/app/layout.tsx` wraps the authenticated tree (`ConvexAuthNextjsServerProvider` + `ConvexClientProvider`) in a `<Suspense>` boundary with a child server component that awaits `connection()` (`next/server`) — so the shell is prerenderable while the auth/Convex tree renders at request time.
- Never use `export const dynamic = "force-dynamic"` here — it conflicts with `cacheComponents`.
- Keep render-time clocks out of static prerender: compute the footer year statically, use `useNow()` (see below) in client components instead of render-time `Date.now()`.

## Client conventions

- **No `asChild`**: Base UI components accept `render` instead. For links/buttons use `Link` + `cn(buttonVariants({ variant, size }))`.
- **Buttons**: no `isLoading` prop. Disable the button and render `<Spinner />` alongside the label.
- **Select / inputs with `onValueChange`**: Base UI yields `string | null`; coerce with `?? ""` before setting state.
- **Convex skip pattern**: `useQuery(api.x.y, isReady ? {} : "skip")`.
- **Icons**: `HugeiconsIcon` from `@hugeicons/react` with `strokeWidth={2}`; use `data-icon="inline-start"` / `"inline-end"` beside text; prefix icons with `size-4`/`size-5` classes.
- **Time**: all business hours and availability are IST. `src/lib/format.ts` exports `todayInIST`, `formatTimeIST`, `formatShortDateIST`, `formatLongDateIST`, `formatDateTimeIST`.
- **Toasts**: `src/lib/toast.ts` (`notifySuccess` / `notifyError` / `notifyInfo`), rendered by `<Toaster />` in the root layout.

## Realtime behaviour

Convex queries are live: queue status, token lifecycle, appointment status, and business schedules update in all open clients the moment a mutation commits. Backend functions enforce authorization (see `convex/lib/authorization.ts`) and atomic transitions — clients never compute authoritative state.

## Diagrams

Technology-agnostic system, flow, and data diagrams (PlantUML source) live in [diagrams.md](diagrams.md).