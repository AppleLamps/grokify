# Imagine Video Extend Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a shared extend-video flow to Grok Imagine that users can start from either the input bar or the lightbox.

**Architecture:** Keep the xAI extension API route as the backend source of truth and add one shared client-side extend action in `ImagineClient`. The input bar and lightbox each get an `Extend` entry point, but both call the same action and save extended clips as new gallery videos.

**Tech Stack:** Next.js App Router, React client components, TypeScript, local IndexedDB gallery store, existing `/api/imagine-video/extend` route.

---

### Task 1: Add extend request tests and shared types

**Files:**
- Modify: `E:/grokify-1/components/imagine/types.ts`
- Test: `E:/grokify-1/tests/drag-drop-utils.test.ts`

**Step 1: Write the failing test**

Use the existing lightweight test pattern only for any new pure helper behavior. Avoid UI mocking.

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/drag-drop-utils.test.ts`
Expected: failing import or assertion for the new behavior.

**Step 3: Write minimal implementation**

Add the shared extend settings types used by both UI entry points.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/drag-drop-utils.test.ts`
Expected: PASS

### Task 2: Add shared extend action to Imagine client

**Files:**
- Modify: `E:/grokify-1/components/imagine/ImagineClient.tsx`

**Step 1: Write the failing test**

Skip route mocking. Validate by wiring the action and verifying app build/tests after implementation.

**Step 2: Implement minimal client action**

Add a shared `handleExtendVideo` callback that:
- accepts `videoUrl`, `prompt`, and `duration`
- calls `/api/imagine-video/extend`
- shows placeholder/loading state
- saves the returned video as a new gallery item via `store.addVideoUrl`

**Step 3: Verify behavior**

Run: `npm test`
Expected: PASS

### Task 3: Add input-bar extend entry point

**Files:**
- Modify: `E:/grokify-1/components/imagine/ImagineInputBar.tsx`
- Modify: `E:/grokify-1/app/imagine/input-bar.css`

**Step 1: Implement minimal UI**

Expose an `Extend` button only when a source video is attached in video mode. Reuse a compact inline modal/panel for prompt and duration.

**Step 2: Verify behavior**

Run: `npm run build`
Expected: PASS

### Task 4: Add lightbox extend entry point

**Files:**
- Modify: `E:/grokify-1/components/imagine/ImagineLightbox.tsx`
- Modify: `E:/grokify-1/app/imagine/lightbox-settings.css`

**Step 1: Implement minimal UI**

Add an `Extend` action for video items, opening the same style of extend form with prompt and duration.

**Step 2: Verify behavior**

Run: `npm run build`
Expected: PASS

### Task 5: Final verification

**Files:**
- Modify only if regressions appear during verification

**Step 1: Run tests**

Run: `npm test`
Expected: all tests pass

**Step 2: Run build**

Run: `npm run build`
Expected: successful production build
