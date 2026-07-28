import { createHash } from 'node:crypto';

export type EmbeddingProviderResult = {
  embedding: number[];
  model: string;
  dimensions: number;
};

export function hashEmbedContent(text: string): string {
  return createHash('sha256').update(text).digest('hex');
}

export function getEmbeddingModel(): string {
  return process.env.SIMPLIFI_EMBEDDING_MODEL?.trim() || 'text-embedding-3-small';
}

export function getEmbeddingVersion(): string {
  return process.env.SIMPLIFI_EMBEDDING_VERSION?.trim() || '1';
}

/**
 * Replaceable embedding provider. Default: OpenAI embeddings API.
 * Returns null when unconfigured or on failure (caller handles retry).
 */
export async function embedText(
  text: string,
  options?: { signal?: AbortSignal },
): Promise<EmbeddingProviderResult | null> {
  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) return null;

  const model = getEmbeddingModel();
  const truncated = text.slice(0, 8000);

  try {
    const res = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model, input: truncated }),
      signal: options?.signal,
    });
    if (!res.ok) {
      console.error('[simplifi-os] embed provider failed', await res.text());
      return null;
    }
    const data = (await res.json()) as {
      data?: Array<{ embedding?: number[] }>;
      model?: string;
    };
    const embedding = data.data?.[0]?.embedding;
    if (!Array.isArray(embedding) || embedding.length === 0) return null;
    return {
      embedding,
      model: data.model ?? model,
      dimensions: embedding.length,
    };
  } catch (err) {
    console.error('[simplifi-os] embed provider error', err);
    return null;
  }
}
