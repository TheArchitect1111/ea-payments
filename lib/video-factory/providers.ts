import { geminiVideoConfigured } from '@/lib/integrations/video/gemini';

export type VideoEngineId = 'remotion' | 'gemini';

export function listVideoEngines() {
  return [
    {
      id: 'remotion' as const,
      role: 'primary',
      label: 'Remotion composition',
      available: true,
      detail: 'Programmatic 1080p documentary scenes. No generative-video quota required.',
    },
    {
      id: 'gemini' as const,
      role: 'optional',
      label: 'Gemini cinematic clip',
      available: geminiVideoConfigured(),
      detail: geminiVideoConfigured()
        ? 'Optional premium generative clip. Requires paid Google video quota.'
        : 'Optional. GEMINI_API_KEY not configured in this environment.',
    },
  ];
}
