import { LIGHTING_MODES, type LightingMode } from './prompt-config-shared';

export interface PromptControlFlags {
  detailBoost?: boolean;
  realismBias?: boolean;
  lightingMode?: LightingMode;
}

const LIGHTING_MODE_INSTRUCTIONS: Record<LightingMode, string> = {
  AUTO: '',
  GOLDEN_HOUR: 'Use warm golden-hour lighting with long soft shadows, luminous highlights, and sunset-grade atmosphere.',
  STUDIO: 'Use controlled studio lighting with clear key and fill separation, clean subject emphasis, and polished commercial light shaping.',
  NOIR: 'Use hard noir lighting with deep shadows, dramatic contrast, selective highlights, and moody cinematic darkness.',
  NEON: 'Use neon-driven lighting with saturated magenta, cyan, or electric color spill, luminous signage glow, and nightlife contrast.',
  OVERCAST: 'Use soft overcast daylight with diffused shadow edges, muted contrast, and natural atmospheric realism.',
  VOLUMETRIC: 'Use volumetric light beams, haze interaction, layered depth, and visible light shafts cutting through the scene.',
};

export const normalizeLightingMode = (lightingMode?: string): LightingMode => {
  if (!lightingMode) {
    return 'AUTO';
  }

  return (LIGHTING_MODES as readonly string[]).includes(lightingMode)
    ? (lightingMode as LightingMode)
    : 'AUTO';
};

export const buildPromptControlBlock = ({
  detailBoost = false,
  realismBias = false,
  lightingMode = 'AUTO',
}: PromptControlFlags) => {
  const instructions: string[] = [];

  if (detailBoost) {
    instructions.push(
      'Increase scene richness with stronger environmental storytelling, layered props, material specificity, micro-texture, and visually readable background detail.'
    );
  }

  if (realismBias) {
    instructions.push(
      'Favor realistic anatomy, believable materials, natural surface response, grounded proportions, and physically plausible image behavior.'
    );
  }

  const lightingInstruction = LIGHTING_MODE_INSTRUCTIONS[lightingMode];
  if (lightingInstruction) {
    instructions.push(lightingInstruction);
  }

  if (instructions.length === 0) {
    return '';
  }

  return `\n\nPrompt controls:\n- ${instructions.join('\n- ')}`;
};
