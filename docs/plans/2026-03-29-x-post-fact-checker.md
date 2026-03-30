# X Post Fact Checker Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Build a new X post fact checker that researches a pasted X post URL with xAI tools and returns a structured, citation-clean result for a dedicated UI.

**Architecture:** Add a dedicated API route that normalizes URLs, calls xAI Responses API in quick/deep modes with `web_search` and `x_search`, parses a strict JSON response, sanitizes any leaked citations from main content, and returns structured data for a dedicated fact-check page. Keep source links isolated in a collapsed UI section.

**Tech Stack:** Next.js App Router, TypeScript, xAI Responses API, Zod, Node test runner, Tailwind CSS

---

### Task 1: Add URL normalization utility

**Files:**
- Create: `E:/grokify-1/lib/fact-check-x-url.ts`
- Test: `E:/grokify-1/tests/fact-check-x-url.test.ts`

**Step 1: Write the failing test**

Cover:
- `x.com/{handle}/status/{id}`
- `twitter.com/{handle}/status/{id}`
- querystring/tracking cleanup
- invalid URL rejection

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/fact-check-x-url.test.ts`

**Step 3: Write minimal implementation**

Export a helper that returns:
- `normalizedUrl`
- `handle`
- `postId`

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/fact-check-x-url.test.ts`

### Task 2: Add output schema and sanitization

**Files:**
- Create: `E:/grokify-1/lib/fact-check-x-schema.ts`
- Create: `E:/grokify-1/lib/fact-check-x-sanitize.ts`
- Test: `E:/grokify-1/tests/fact-check-x-sanitize.test.ts`

**Step 1: Write the failing test**

Cover:
- markdown links are removed from `summaryMd`
- raw URLs are removed from `claims[].rationale`
- `sources` URLs are preserved
- duplicate sources collapse cleanly

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/fact-check-x-sanitize.test.ts`

**Step 3: Write minimal implementation**

Add:
- Zod schema for final API response
- helper that strips URLs/citation markers from main content

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/fact-check-x-sanitize.test.ts`

### Task 3: Add xAI orchestration helper

**Files:**
- Create: `E:/grokify-1/lib/fact-check-x.ts`
- Test: `E:/grokify-1/tests/fact-check-x.test.ts`

**Step 1: Write the failing test**

Cover:
- quick mode chooses the reasoning model
- deep mode chooses the multi-agent model
- both modes attach `web_search` and `x_search`
- malformed output fails parse

**Step 2: Run test to verify it fails**

Run: `npm test -- tests/fact-check-x.test.ts`

**Step 3: Write minimal implementation**

Implement orchestration:
- build prompt
- call `https://api.x.ai/v1/responses`
- validate JSON output
- sanitize and return final shaped result

**Step 4: Run test to verify it passes**

Run: `npm test -- tests/fact-check-x.test.ts`

### Task 4: Add API route

**Files:**
- Create: `E:/grokify-1/app/api/fact-check-x/route.ts`

**Step 1: Write route-level failing test if practical**

If direct route testing is practical, add one focused test for invalid URL rejection and one for success path.

**Step 2: Implement route**

Route responsibilities:
- validate request body
- normalize URL
- call orchestration helper
- return structured JSON

**Step 3: Run focused tests**

Run: `npm test -- tests/fact-check-x-url.test.ts tests/fact-check-x-sanitize.test.ts tests/fact-check-x.test.ts`

### Task 5: Add minimal UI page

**Files:**
- Create: `E:/grokify-1/app/fact-check/page.tsx`
- Create: `E:/grokify-1/components/fact-check/FactCheckClient.tsx`

**Step 1: Build basic UI**

Add:
- URL input
- mode toggle (`quick` / `deep`)
- submit button
- disclaimer
- main analysis panel
- claim verdict cards/table
- collapsed sources section

**Step 2: Keep styling coherent with current app**

Reuse existing visual language rather than inventing a separate app.

**Step 3: Manual check via local dev if needed**

If you run the dev server, verify the page loads and the sources section is collapsed by default.

### Task 6: Update README

**Files:**
- Modify: `E:/grokify-1/README.md`

**Step 1: Add feature snippet**

Document:
- fact-checker feature
- `XAI_API_KEY`
- quick/deep model names if hardcoded

**Step 2: Keep docs concise**

Only add the minimum needed for setup and route discovery.

### Task 7: Full verification

**Files:**
- None unless fixes are needed

**Step 1: Run full test suite**

Run: `npm test`

**Step 2: Run typecheck**

Run: `npx tsc --noEmit`

**Step 3: Report unrelated pre-existing failures separately**

If the existing `DataTransfer` cast issue remains, report it as pre-existing rather than bundling it into this feature.
