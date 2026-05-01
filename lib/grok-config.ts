export const XAI_REASONING_MODEL = 'grok-4.20-reasoning';

export const OPENROUTER_REASONING_MODEL = 'x-ai/grok-4.3';

export const HIDDEN_REASONING_INSTRUCTIONS = [
  'Reason privately before answering.',
  'Do not reveal your reasoning, chain-of-thought, or intermediate analysis.',
  'Return only the requested final answer or structured output.',
  'Never include reasoning text, summaries of reasoning, or scratch work.',
].join(' ');

export function appendHiddenReasoningInstructions(basePrompt: string): string {
  return `${basePrompt}

REASONING BEHAVIOR: ${HIDDEN_REASONING_INSTRUCTIONS}`;
}
