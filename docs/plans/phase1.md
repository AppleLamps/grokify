# Phase 1 Quality and Prompt Generator Stabilization

## Summary

Stabilize the repo after the Grok 4.3 prompt-generator change by making the full test suite and TypeScript check green, enforcing OpenRouter structured-output routing, and aligning docs/tests with the current feature flags and model defaults.

## Key Changes

- Fix known red checks: `DataTransfer` test casts, Grok Imagine disabled-state drift, and fact-check deep-model assertions.
- Harden `/api/prompt-generate` by requiring OpenRouter providers that support requested parameters, because prompt parsing depends on strict JSON schema output.
- Add route-level prompt generator tests for the OpenRouter endpoint, `OPENROUTER_API_KEY`, attribution headers, `x-ai/grok-4.3`, strict JSON schema response format, and `provider.require_parameters`.
- Keep public `/api/prompt-generate` request and response shapes unchanged.
- Align README environment and API notes with the current OpenRouter prompt-generator and fact-check model behavior.

## Test Plan

- `npx tsc --noEmit`
- `npx tsx --test tests/**/*.test.ts`

## Assumptions

- Grok Imagine image generation remains disabled in Phase 1 so API guards, UI helper copy, and tests share one source of truth.
- Fact-check quick mode uses `XAI_REASONING_MODEL`; deep mode uses `XAI_FACT_CHECK_DEEP_MODEL` unless `XAI_FACT_CHECK_DEEP_MODEL` is set in the environment.
- OpenRouter Grok 4.3 is the prompt-generator model, and strict structured output support is required for successful response parsing.
- Reference docs: [Grok 4.3 model page](https://openrouter.ai/x-ai/grok-4.3), [Structured Outputs](https://openrouter.ai/docs/guides/features/structured-outputs), [Chat completions](https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request).
