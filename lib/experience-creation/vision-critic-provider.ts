/**
 * Provider-neutral vision critic adapter.
 * Prefers the EA OpenAI gateway config; optional Anthropic fallback.
 * Never requires Anthropic when OpenAI vision is configured.
 */
import { getAIGatewayConfig } from '@/lib/ai/config';
import { describeScreenshotBase64 } from '@/lib/screenshot-vision';

export type VisionCriticProviderId = 'openai-gateway' | 'anthropic' | 'none';

export type VisionCriticProvider = {
  id: VisionCriticProviderId;
  ready: boolean;
  model?: string;
  missing?: string;
};

export function resolveVisionCriticProvider(): VisionCriticProvider {
  const config = getAIGatewayConfig();
  if (config.apiKey?.trim()) {
    return {
      id: 'openai-gateway',
      ready: true,
      model: config.visionModel || config.defaultModel || 'gpt-4.1-mini',
    };
  }
  if (process.env.ANTHROPIC_API_KEY?.trim() || process.env.CLAUDE_API_KEY?.trim()) {
    return {
      id: 'anthropic',
      ready: true,
      model: process.env.CLAUDE_MODEL?.trim() || 'claude-sonnet-4-6',
    };
  }
  return {
    id: 'none',
    ready: false,
    missing: 'OPENAI_API_KEY (preferred) or ANTHROPIC_API_KEY',
  };
}

async function critiqueViaOpenAI(
  base64: string,
  mimeType: string,
  prompt: string,
  model: string,
): Promise<string | null> {
  const config = getAIGatewayConfig();
  if (!config.apiKey) return null;
  const raw = base64.replace(/^data:image\/\w+;base64,/, '');
  const mediaType = mimeType.startsWith('image/') ? mimeType : 'image/png';

  const response = await fetch(`${config.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      temperature: 0.2,
      max_output_tokens: 1600,
      text: { format: { type: 'json_object' } },
      input: [
        {
          role: 'user',
          content: [
            { type: 'input_text', text: prompt },
            {
              type: 'input_image',
              image_url: `data:${mediaType};base64,${raw}`,
            },
          ],
        },
      ],
    }),
    signal: AbortSignal.timeout(config.requestTimeoutMs || 60_000),
  });

  if (!response.ok) {
    console.error('OpenAI vision critic failed:', response.status);
    return null;
  }

  const data = (await response.json()) as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };
  if (data.output_text?.trim()) return data.output_text.trim();
  const text = data.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text ?? '')
    .filter(Boolean)
    .join('\n')
    .trim();
  return text || null;
}

/** Critique a screenshot using the configured vision-capable provider. */
export async function critiqueScreenshotWithConfiguredProvider(
  base64: string,
  mimeType = 'image/png',
  prompt: string,
): Promise<{ text: string | null; provider: VisionCriticProvider }> {
  const provider = resolveVisionCriticProvider();
  if (!provider.ready) {
    return { text: null, provider };
  }

  if (provider.id === 'openai-gateway') {
    const text = await critiqueViaOpenAI(base64, mimeType, prompt, provider.model!);
    return { text, provider };
  }

  const text = await describeScreenshotBase64(base64, mimeType, { prompt });
  return { text, provider };
}
