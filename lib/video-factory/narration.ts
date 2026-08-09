/**
 * Pluggable narration providers.
 * Captions always come from scene.narration text.
 * Audio is optional — do not fail a render if TTS is unavailable.
 */
export type NarrationProviderId = 'none' | 'openai-tts';

export type NarrationProviderStatus = {
  id: NarrationProviderId;
  available: boolean;
  detail: string;
};

export function resolveNarrationProvider(): NarrationProviderStatus {
  if (process.env.OPENAI_API_KEY?.trim()) {
    return {
      id: 'openai-tts',
      available: true,
      detail: 'OpenAI TTS available. Not required for Remotion captions or picture lock.',
    };
  }
  return {
    id: 'none',
    available: false,
    detail: 'No TTS key configured. Episode renders with on-screen captions only.',
  };
}
