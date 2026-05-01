# Phase 2 Controlled Grok Imagine Re-enable Path

## Summary

Make Grok Imagine availability configurable instead of hardcoded, while keeping image and video generation disabled by default. This gives production a deliberate re-enable path without weakening the API guards added in Phase 1.

## Key Changes

- Gate image and video availability with explicit public feature flags:
  - `NEXT_PUBLIC_GROK_IMAGE_GENERATION_ENABLED`
  - `NEXT_PUBLIC_GROK_VIDEO_GENERATION_ENABLED`
- Keep both flags defaulted to disabled unless their value is one of `true`, `1`, `yes`, or `on`.
- Render the real Imagine client only when at least one Imagine generation mode is enabled; otherwise show the maintenance screen.
- Add route tests proving `/api/imagine` and `/api/imagine-video` return 503 while their feature flags are disabled.
- Document the flags in `.env.example` and README so re-enabling is an intentional deployment change.

## Test Plan

- `npx tsc --noEmit`
- `npx tsx --test tests/**/*.test.ts`

## Assumptions

- Phase 2 creates a controlled re-enable path, but does not turn Grok Imagine on by default.
- Video remains disabled by the availability flag before the separate video maintenance guard is reached.
- Because the flags are `NEXT_PUBLIC_*`, changing them requires rebuilding/redeploying the Next.js app.
