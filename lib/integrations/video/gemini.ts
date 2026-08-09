const GEMINI_INTERACTIONS_URL = 'https://generativelanguage.googleapis.com/v1beta/interactions';

export type GeminiVideoAspectRatio = '16:9' | '9:16';

export type GeminiGeneratedVideo = {
  bytes: Uint8Array;
  mimeType: string;
  interactionId?: string;
};

type InteractionContent = {
  type?: string;
  mime_type?: string;
  data?: string;
};

type InteractionStep = {
  type?: string;
  content?: InteractionContent[];
};

type GeminiInteractionResponse = {
  id?: string;
  status?: string;
  steps?: InteractionStep[];
  error?: { message?: string } | string;
};

function requiredApiKey(): string {
  const value = process.env.GEMINI_API_KEY?.trim();
  if (!value) throw new Error('GEMINI_API_KEY is not configured.');
  return value;
}

export function geminiVideoConfigured(): boolean {
  return Boolean(process.env.GEMINI_API_KEY?.trim());
}

function extractVideo(response: GeminiInteractionResponse): GeminiGeneratedVideo {
  for (const step of response.steps ?? []) {
    if (step.type !== 'model_output') continue;
    for (const content of step.content ?? []) {
      if (content.type !== 'video' || !content.data) continue;
      return {
        bytes: new Uint8Array(Buffer.from(content.data, 'base64')),
        mimeType: content.mime_type || 'video/mp4',
        interactionId: response.id,
      };
    }
  }

  throw new Error('Gemini completed without returning video bytes.');
}

export async function generateGeminiVideo(input: {
  prompt: string;
  aspectRatio?: GeminiVideoAspectRatio;
}): Promise<GeminiGeneratedVideo> {
  const prompt = input.prompt.trim();
  if (!prompt) throw new Error('Video prompt is required.');

  const apiKey = requiredApiKey();
  const response = await fetch(`${GEMINI_INTERACTIONS_URL}?key=${encodeURIComponent(apiKey)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: 'gemini-omni-flash-preview',
      input: prompt,
      response_format: {
        type: 'video',
        aspect_ratio: input.aspectRatio ?? '16:9',
      },
    }),
    cache: 'no-store',
  });

  const payload = (await response.json()) as GeminiInteractionResponse;
  if (!response.ok) {
    const detail =
      typeof payload.error === 'string'
        ? payload.error
        : payload.error?.message || `HTTP ${response.status}`;
    throw new Error(`Gemini video generation failed: ${detail}`);
  }

  return extractVideo(payload);
}
