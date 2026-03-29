# Loading Overlay Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Make the loading overlay feel more premium while making the displayed progress percentage match the real app stages more closely.

**Architecture:** Extract progress calculation into a small pure helper that maps loading type, stage, and elapsed time into believable ranges. Update the overlay presentation in place to use the helper, stronger layout hierarchy, and clearer telemetry labels without changing the surrounding page structure.

**Tech Stack:** Next.js, React, TypeScript, Tailwind CSS, Node test runner

---

### Task 1: Add progress helper and regression tests

**Files:**
- Create: `E:/grokify-1/lib/loading-overlay-progress.ts`
- Create: `E:/grokify-1/tests/loading-overlay-progress.test.ts`

**Step 1: Write the failing test**

Cover:
- single-stage loaders start above 0 but below 20
- staged loaders reserve the second stage for later percentages
- video analyze stage stays clearly below video generation stage
- progress never reaches 100 before completion

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/loading-overlay-progress.test.ts`

**Step 3: Write minimal implementation**

Add a pure helper that returns:
- `progress`
- `phaseLabel`
- `statusLabel`

with stage-weighted ranges per loading type.

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/loading-overlay-progress.test.ts`

### Task 2: Redesign overlay presentation

**Files:**
- Modify: `E:/grokify-1/components/LoadingOverlay.tsx`

**Step 1: Update component to consume helper**

Replace inline time math with the helper output.

**Step 2: Improve visual hierarchy**

Add:
- stronger headline/subheadline relationship
- richer panel framing and spotlight treatment
- telemetry row for percent, elapsed time, and current phase
- more intentional step marker treatment

**Step 3: Keep stage labels honest**

Use helper-driven labels so early analyze phases do not claim near-complete percentages.

**Step 4: Run focused tests**

Run: `npm test -- tests/loading-overlay-progress.test.ts tests/grok-config.test.ts tests/prompt-route-utils.test.ts tests/prompt-controls.test.ts`

### Task 3: Verify and document actual status

**Files:**
- None unless follow-up fixes are needed

**Step 1: Run full test suite**

Run: `npm test`

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`

**Step 3: Report any pre-existing failures separately**

If typecheck still fails on unrelated test casts, call that out explicitly.
