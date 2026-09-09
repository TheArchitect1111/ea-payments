export interface AIGatewayConfig {
  provider: 'openai';
  apiKey: string;
  baseUrl: string;
  providers: AIProviderConfig[];
  defaultModel: string;
  researchModel: string;
  /** Vision-capable model for screenshot criticism (falls back to defaultModel). */
  visionModel: string;
  /** Ordered cross-provider model fallback chain used by Vercel AI Gateway. */
  gatewayModels: string[];
  maxHistoryMessages: number;
  requestTimeoutMs: number;
  retryCount: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  promptVersion: string;
}

export interface AIProviderConfig {
  id: 'gateway' | 'omniroute' | 'openai';
  apiKey: string;
  baseUrl: string;
  /** True when this provider understands Vercel AI Gateway model/provider options. */
  supportsGatewayRouting?: boolean;
}

function csv(value: string | undefined, fallback: string[]): string[] {
  const parsed = (value ?? '')
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);
  return parsed.length ? parsed : fallback;
}

export function getAIGatewayConfig(): AIGatewayConfig {
  const defaultModel = process.env.AI_MODEL_DEFAULT ?? 'gpt-4.1-mini';
  const gatewayModels = csv(process.env.AI_GATEWAY_MODELS, [
    'openai/gpt-5.4',
    'anthropic/claude-sonnet-4.6',
    'google/gemini-3.1-pro-preview',
  ]);
  const gateway: AIProviderConfig = {
    id: 'gateway',
    apiKey: process.env.AI_GATEWAY_API_KEY ?? process.env.VERCEL_OIDC_TOKEN ?? '',
    baseUrl: (process.env.AI_GATEWAY_BASE_URL ?? 'https://ai-gateway.vercel.sh/v1').replace(/\/$/, ''),
    supportsGatewayRouting: true,
  };
  const openAI: AIProviderConfig = {
    id: 'openai',
    apiKey: process.env.OPENAI_API_KEY ?? '',
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
  };
  const omniRoute: AIProviderConfig = {
    id: 'omniroute',
    apiKey: process.env.OMNIROUTE_API_KEY ?? '',
    baseUrl: (process.env.OMNIROUTE_BASE_URL ?? '').replace(/\/$/, ''),
  };

  // Prefer the multi-provider gateway first. Existing provider keys remain as lower-level
  // fallbacks so an AI Gateway auth/configuration problem does not become a new SPOF.
  const providers = [gateway, omniRoute, openAI].filter((provider) => provider.apiKey && provider.baseUrl);

  return {
    provider: 'openai',
    apiKey: openAI.apiKey,
    baseUrl: openAI.baseUrl,
    providers,
    defaultModel,
    researchModel: process.env.AI_MODEL_RESEARCH ?? defaultModel,
    visionModel: process.env.AI_MODEL_VISION ?? defaultModel,
    gatewayModels,
    maxHistoryMessages: Number(process.env.AI_MAX_HISTORY_MESSAGES ?? 16),
    requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 30000),
    retryCount: Number(process.env.AI_RETRY_COUNT ?? 2),
    rateLimitWindowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60000),
    rateLimitMaxRequests: Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS ?? 30),
    promptVersion: process.env.AI_PROMPT_VERSION ?? 'ea-agent-framework-v1',
  };
}
