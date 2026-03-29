export const IMAGINE_HANDOFF_QUERY = 'prompt';
const IMAGINE_HANDOFF_STORAGE_KEY = 'grokify:imagine-handoff';

export interface ImagineHandoffPayload {
  prompt: string;
  autogenerate?: boolean;
  createdAt: number;
}

export function saveImagineHandoff(payload: ImagineHandoffPayload) {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(IMAGINE_HANDOFF_STORAGE_KEY, JSON.stringify(payload));
}

export function consumeImagineHandoff(): ImagineHandoffPayload | null {
  if (typeof window === 'undefined') return null;

  const raw = window.sessionStorage.getItem(IMAGINE_HANDOFF_STORAGE_KEY);
  window.sessionStorage.removeItem(IMAGINE_HANDOFF_STORAGE_KEY);

  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<ImagineHandoffPayload>;
    const prompt = typeof parsed.prompt === 'string' ? parsed.prompt.trim() : '';

    if (!prompt) return null;

    return {
      prompt,
      autogenerate: parsed.autogenerate === true,
      createdAt: typeof parsed.createdAt === 'number' ? parsed.createdAt : Date.now(),
    };
  } catch {
    return null;
  }
}
