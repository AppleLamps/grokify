# Imagine Prompt Merge Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Merge the raw scene prompt and the selected style instruction into one coherent Grok Imagine prompt on the server before calling the image generation API.

**Architecture:** Add a small xAI-backed merge helper under `lib/` that accepts the raw prompt and a resolved style prompt, returns a merged prompt, and falls back safely when the merge call fails. Use that helper in `app/api/imagine/route.ts` after request validation and style resolution, without changing the client contract.

**Tech Stack:** Next.js route handlers, TypeScript, xAI Chat Completions API, Node test runner, Zod

---

### Task 1: Add failing tests for prompt merge helper

**Files:**
- Create: `E:/grokify-1/tests/merge-imagine-prompt.test.ts`

**Step 1: Write the failing test**

Cover:
- successful merge returns the assistant prompt text
- empty merge output falls back to `stylePrompt + rawPrompt`
- no valid style skips merge and keeps raw prompt logic in the route path

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/merge-imagine-prompt.test.ts`

### Task 2: Implement merge helper

**Files:**
- Create: `E:/grokify-1/lib/merge-imagine-prompt.ts`

**Step 1: Add helper API**

Implement:
- style-aware merge via `https://api.x.ai/v1/chat/completions`
- `fetchWithTimeout`
- `XAI_REASONING_MODEL`
- separate breaker key
- safe fallback behavior

**Step 2: Run focused tests**

Run: `npm test -- tests/merge-imagine-prompt.test.ts`

### Task 3: Wire helper into Imagine route

**Files:**
- Modify: `E:/grokify-1/app/api/imagine/route.ts`

**Step 1: Replace direct prepend merge**

Only run merge when style is valid and non-default.

**Step 2: Preserve existing generations/edit API contract**

Keep request body shape the same except for using the merged prompt string.

**Step 3: Run focused tests**

Run: `npm test -- tests/merge-imagine-prompt.test.ts tests/loading-overlay-progress.test.ts tests/grok-config.test.ts`

### Task 4: Verify full status

**Files:**
- None unless follow-up fixes are needed

**Step 1: Run full test suite**

Run: `npm test`

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`

**Step 3: Report unrelated pre-existing failures separately**
