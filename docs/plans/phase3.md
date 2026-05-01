# Phase 3 Project-Wide Review and Hardening

## Summary

Review the full project for optimization, security, cost-control, data-leak, and maintainability risks after the Phase 1 and Phase 2 stabilization work. Phase 3 now hardens the risky public proxy/upload paths, restores lint/build hygiene, and reduces production AI payload logging.

## Priority Findings

- Security dependencies: upgraded `next`, `@vercel/blob`, `drizzle-orm`, `nanoid`, `zod`, and `postcss`. `npm audit --omit=dev` now has no high vulnerabilities; it still reports moderate PostCSS advisories through Next's nested dependency because npm has not published a `postcss` version satisfying `>=8.5.10` yet.
- Linting: replaced `next lint` with ESLint CLI, added flat ESLint config, and aligned `eslint-config-next` with Next 16.
- Image proxy SSRF risk: `/api/proxy-image` now accepts only `http:`/`https:`, blocks private/local/link-local hosts after DNS resolution, requires `image/*`, uses timeout, and caps responses at 10 MB.
- Upload abuse risk: image/video data URLs now use shared MIME/size validation, anonymous rate limits, and signed short-lived upload intents before Blob client upload tokens are minted.
- Remote image policy: removed the wildcard `images.remotePatterns` block because the repo does not use `next/image`; `turbopack.root` is pinned to the project directory.
- Production log leakage: prompt/media/upstream body logs were replaced with redacted metadata logs in the image routes and bot pipeline hotspots.

## Recommended Implementation Order

1. Dependency and tooling baseline:
   - Upgrade `next`, `@vercel/blob`, `postcss`, and compatible patch/minor packages.
   - Plan the `drizzle-orm` upgrade separately because audit marks it as breaking.
   - Replace `next lint` with a working ESLint command and add lint to the standard verification set.
   - Set `turbopack.root` in `next.config.js` or remove the stray parent `C:\Users\lucas\package-lock.json` so builds resolve the intended workspace root.
2. Network and upload hardening:
   - Restrict `/api/proxy-image` to `http:`/`https:`, block localhost/private/link-local metadata ranges, enforce image content types, add `fetchWithTimeout`, cap response bytes, and return `no-store` for failures.
   - Add decoded byte limits and MIME allowlists to image upload paths.
   - Require an app-specific authorization or signed intent for Blob upload-token creation and server-side upload endpoints.
   - Add per-IP or per-user rate limiting for high-cost and storage-writing routes.
3. Logging and observability:
   - Add a small server logger that redacts API keys, data URLs, prompts, and upstream bodies by default.
   - Keep detailed debug logs behind an explicit non-production flag.
   - Standardize route errors so user-facing messages stay generic while logs retain safe request IDs.
4. Cost and resilience:
   - Move in-memory circuit breaker state to a shared store if multiple serverless instances are expected.
   - Wire the existing `usage_tracking` schema or remove it until a real quota feature is implemented.
   - Add route tests for proxy rejection cases, upload size limits, and disabled/unauthorized upload-token behavior.

## Verification

- `npx tsc --noEmit`
- `npx tsx --test tests/**/*.test.ts`
- `npm run build`
- `npm audit --omit=dev`
- Working lint command after replacing `next lint`

## Review Results

- Passed: `npx tsc --noEmit`
- Passed: `npx tsx --test tests/**/*.test.ts`
- Passed: `npm run lint` with existing warnings only
- Passed: `npm run build`
- Ran: `npm audit --omit=dev`; no high vulnerabilities remain, but npm still reports 2 moderate PostCSS findings via `next/node_modules/postcss <8.5.10`. The latest published PostCSS version is `8.5.9`, so this is blocked on upstream package publication or a future Next release that resolves the nested advisory.
- Secret scan: no committed live keys found; matches were placeholders or test fixtures
