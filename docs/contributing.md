# Contributing

## Workflow

1. **Understand first** — read the relevant page/route and the Convex functions it calls before editing.
2. **Follow existing patterns** — the codebase is deliberately consistent (see [architecture](architecture.md)). Mirror neighbouring files.
3. **Verify both gates** — typecheck and lint must be clean for every change:

   ```bash
   pnpm exec tsc --noEmit
   pnpm eslint src
   ```

4. **Commit** only when asked, with a concise message matching the repo style. Never commit `.env.local` or secrets.

## Style rules

These are enforced by the project's ESLint config (`eslint.config.mjs`, React Hooks v6 rules). Common violations to avoid:

- **`react-hooks/set-state-in-effect`** — don't call `setState` synchronously inside `useEffect`. Initialize state lazily (`useState(() => …)`) instead, or set state only in async event handlers / `setInterval` callbacks.
- **`react-hooks/exhaustive-deps`** — a `?.filter(...)`/`useMemo` result used in a dependency array must itself be memoized before use.
- **`no-impure-render`** — no `Date.now()` (or other clocks) during render. Use the `useNow(intervalMs)` hook (`src/hooks/use-now.ts`), which ticks on an interval.
- **Unused imports** — icons, components, and router instances left over from edits are lint errors; remove them.

Code conventions:

- No code comments unless explicitly requested.
- `"use client"` at the top of components using hooks/state.
- Params are Promises — `const { id } = use(params)` on client pages.
- Base UI: use `render` (not `asChild`); `Link` + `cn(buttonVariants(...))` for link-buttons; `Spinner` + `disabled` instead of an `isLoading` prop; coalesce `onValueChange` values with `?? ""`.
- Icons: `HugeiconsIcon` with `strokeWidth={2}`, `size-4`/`size-5` classes, `data-icon="inline-start/end"` near text. Verify an icon exists before using its name (see the hugeicons package exports).
- Confirmation flows: `window.confirm`/`alert` are banned; use the `AlertDialog` composite in `src/components/ui/alert-dialog.tsx`.
- Shared presentational pieces already exist — check `src/components/ui/*`, `src/components/business/*`, `src/components/customer/*` (e.g. `PageHeader`, `Empty`, skeletons, toasts) before writing new markup.

## Verification checklist

- [ ] `pnpm exec tsc --noEmit` — 0 errors (delete stale `.next/dev/types` if a deleted route was recently removed, then retry).
- [ ] `pnpm eslint src` — 0 problems.
- [ ] Smoke-tested affected routes against a running dev server (route status codes, redirects for protected routes, no prerender-time errors in the dev log).