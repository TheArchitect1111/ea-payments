export interface AIGatewayConfig {
  provider: 'openai';
  apiKey: string;
  baseUrl: string;
  defaultModel: string;
  researchModel: string;
  maxHistoryMessages: number;
  requestTimeoutMs: number;
  retryCount: number;
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  promptVersion: string;
}

export function getAIGatewayConfig(): AIGatewayConfig {
  return {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY ?? '',
    baseUrl: process.env.OPENAI_BASE_URL ?? 'https://api.openai.com/v1',
    defaultModel: process.env.AI_MODEL_DEFAULT ?? 'gpt-4.1-mini',
    researchModel: process.env.AI_MODEL_RESEARCH ?? process.env.AI_MODEL_DEFAULT ?? 'gpt-4.1-mini',
    maxHistoryMessages: Number(process.env.AI_MAX_HISTORY_MESSAGES ?? 16),
    requestTimeoutMs: Number(process.env.AI_REQUEST_TIMEOUT_MS ?? 30000),
    retryCount: Number(process.env.AI_RETRY_COUNT ?? 2),
    rateLimitWindowMs: Number(process.env.AI_RATE_LIMIT_WINDOW_MS ?? 60000),
    rateLimitMaxRequests: Number(process.env.AI_RATE_LIMIT_MAX_REQUESTS ?? 30),
    promptVersion: process.env.AI_PROMPT_VERSION ?? 'ea-agent-framework-v1',
  };
}
