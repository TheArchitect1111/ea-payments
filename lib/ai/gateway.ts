import { getAIGatewayConfig, type AIProviderConfig } from '@/lib/ai/config';
import { logAIEvent, trackAIUsage } from '@/lib/ai/logging';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { buildGatewaySystemPrompt, detectPromptInjection } from '@/lib/ai/security';
import type { AIGatewayRequest, AIGatewayResponse, AIMessage, AIRequestContext, AIUsage } from '@/lib/ai/types';

const conversationHistory = new Map<string, AIMessage[]>();

function conversationHistoryKey(
  conversationId: string | undefined,
  context: AIRequestContext,
): string | null {
  if (!conversationId) return null;
  const tenantScope = context.actor.portalSlug?.trim() || context.actor.id.trim();
  if (!tenantScope) return null;
  return `${context.actor.type}:${tenantScope}:${conversationId}`;
}

export class AIGatewayError extends Error {
  constructor(message: string, public code = 'AI_GATEWAY_ERROR', public status = 500) {
    super(message);
  }
}

function usageFromOpenAI(value: unknown): AIUsage {
  const usage = value as { input_tokens?: number; output_tokens?: number; total_tokens?: number };
  return {
    inputTokens: usage?.input_tokens ?? 0,
    outputTokens: usage?.output_tokens ?? 0,
    totalTokens: usage?.total_tokens ?? 0,
  };
}

function textFromOpenAI(data: unknown): string {
  const response = data as {
    output_text?: string;
    output?: Array<{ content?: Array<{ text?: string; type?: string }> }>;
  };
  if (response.output_text) return response.output_text;
  return response.output
    ?.flatMap((item) => item.content ?? [])
    .map((item) => item.text ?? '')
    .filter(Boolean)
    .join('\n')
    .trim() ?? '';
}

function modelFromOpenAI(data: unknown, fallback: string): string {
  const response = data as { model?: string };
  return response.model?.trim() || fallback;
}

function openAIInput(messages: AIMessage[]) {
  return messages.map((message) => ({
    role: message.role === 'tool' ? 'user' : message.role,
    content: message.content,
  }));
}

function withHistory(request: AIGatewayRequest, context: AIRequestContext, maxHistoryMessages: number): AIMessage[] {
  const key = conversationHistoryKey(request.conversationId, context);
  if (!key) return request.messages;
  const stored = conversationHistory.get(key) ?? [];
  return [...stored, ...request.messages].slice(-maxHistoryMessages);
}

function saveHistory(conversationId: string | undefined, context: AIRequestContext, messages: AIMessage[], assistantText: string, maxHistoryMessages: number) {
  const key = conversationHistoryKey(conversationId, context);
  if (!key) return;
  const assistantMessage: AIMessage = { role: 'assistant', content: assistantText };
  conversationHistory.set(key, [...messages, assistantMessage].slice(-maxHistoryMessages));
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function fetchWithRetry(url: string, init: RequestInit, retries: number, timeoutMs: number) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok) return response;
      const retryable = response.status === 408 || response.status === 409 || response.status === 425 || response.status === 429 || response.status >= 500;
      if (!retryable || attempt === retries) return response;
      const retryAfter = Number(response.headers.get('retry-after'));
      const waitMs = Number.isFinite(retryAfter) && retryAfter > 0
        ? Math.min(30_000, retryAfter * 1000)
        : Math.min(15_000, 1000 * (2 ** attempt));
      await delay(waitMs);
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt === retries) throw err;
      await delay(Math.min(15_000, 1000 * (2 ** attempt)));
    }
  }
  throw lastError instanceof Error ? lastError : new Error('AI request failed.');
}

function directModel(model: string): string {
  return model.startsWith('openai/') ? model.slice('openai/'.length) : model;
}

function gatewayModel(model: string, gatewayModels: string[]): string {
  if (model.includes('/')) return model;
  const matchingOpenAI = gatewayModels.find((candidate) => candidate === `openai/${model}`);
  return matchingOpenAI ?? gatewayModels[0] ?? `openai/${model}`;
}

function requestBodyForProvider(
  candidate: AIProviderConfig,
  request: AIGatewayRequest,
  model: string,
  gatewayModels: string[],
  inputMessages: AIMessage[],
  context: AIRequestContext,
  promptVersion: string,
  stream = false,
) {
  const selectedModel = candidate.supportsGatewayRouting ? gatewayModel(model, gatewayModels) : directModel(model);
  const fallbackModels = candidate.supportsGatewayRouting
    ? gatewayModels.filter((item) => item !== selectedModel)
    : [];

  return {
    model: selectedModel,
    input: openAIInput(inputMessages),
    temperature: request.temperature ?? 0.2,
    max_output_tokens: request.maxOutputTokens ?? 1200,
    stream: stream || undefined,
    text: !stream && request.responseFormat === 'json' ? { format: { type: 'json_object' } } : undefined,
    providerOptions: candidate.supportsGatewayRouting ? {
      gateway: {
        models: fallbackModels,
        sort: 'ttft',
        user: context.actor.id,
        tags: [
          'platform:ea',
          `route:${context.route ?? 'unknown'}`,
          `actor:${context.actor.type}`,
        ],
      },
    } : undefined,
    metadata: stream ? undefined : {
      requestId: context.requestId,
      actorType: context.actor.type,
      route: context.route ?? 'unknown',
      promptVersion,
      ...request.metadata,
    },
  };
}

export async function runAIGateway(request: AIGatewayRequest, context: AIRequestContext): Promise<AIGatewayResponse> {
  const config = getAIGatewayConfig();
  if (!config.providers.length) throw new AIGatewayError('No AI gateway provider is configured.', 'AI_PROVIDER_NOT_CONFIGURED', 503);

  const limit = checkRateLimit(context.actor.id, config.rateLimitMaxRequests, config.rateLimitWindowMs);
  if (!limit.ok) throw new AIGatewayError('AI rate limit reached. Try again shortly.', 'AI_RATE_LIMITED', 429);

  const messages = withHistory(request, context, config.maxHistoryMessages);
  const injectionSignals = detectPromptInjection(messages);
  if (injectionSignals.length) {
    logAIEvent('ai.prompt_injection_signal', context, { signals: injectionSignals.length });
  }

  const promptVersion = request.promptVersion ?? config.promptVersion;
  const system = buildGatewaySystemPrompt(request.system ?? '', promptVersion);
  const requestedModel = request.model ?? config.defaultModel;
  const inputMessages: AIMessage[] = [{ role: 'system', content: system }, ...messages];

  let response: Response | null = null;
  let provider: 'gateway' | 'omniroute' | 'openai' | null = null;
  let attemptedModel = requestedModel;
  const failures: string[] = [];

  for (const candidate of config.providers) {
    const body = requestBodyForProvider(candidate, request, requestedModel, config.gatewayModels, inputMessages, context, promptVersion);
    attemptedModel = String(body.model);
    logAIEvent('ai.request', context, {
      model: attemptedModel,
      promptVersion,
      stream: false,
      provider: candidate.id,
      fallbackModels: candidate.supportsGatewayRouting ? config.gatewayModels.length - 1 : 0,
    });
    try {
      const attempt = await fetchWithRetry(`${candidate.baseUrl}/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${candidate.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }, config.retryCount, config.requestTimeoutMs);
      if (attempt.ok) {
        response = attempt;
        provider = candidate.id;
        break;
      }
      failures.push(`${candidate.id}:${attemptedModel}:${attempt.status}`);
      logAIEvent('ai.provider_failover', context, { provider: candidate.id, model: attemptedModel, status: attempt.status });
    } catch (error) {
      failures.push(`${candidate.id}:${attemptedModel}:${error instanceof Error ? error.message : 'request failed'}`);
      logAIEvent('ai.provider_failover', context, { provider: candidate.id, model: attemptedModel, error: error instanceof Error ? error.message : 'request failed' });
    }
  }

  if (!response || !provider) {
    throw new AIGatewayError(`AI providers failed: ${failures.join(', ').slice(0, 700)}`, 'AI_PROVIDER_ERROR', 502);
  }

  const data = await response.json();
  const text = textFromOpenAI(data);
  const actualModel = modelFromOpenAI(data, attemptedModel);
  const usage = usageFromOpenAI((data as { usage?: unknown }).usage);
  saveHistory(request.conversationId, context, messages, text, config.maxHistoryMessages);
  trackAIUsage(context, actualModel, usage);
  logAIEvent('ai.response', context, { provider, requestedModel, model: actualModel, failoverUsed: provider !== config.providers[0]?.id || actualModel !== attemptedModel });

  return { ok: true, requestId: context.requestId, provider, model: actualModel, text, usage, promptVersion };
}

export async function streamAIGateway(request: AIGatewayRequest, context: AIRequestContext): Promise<Response> {
  const config = getAIGatewayConfig();
  if (!config.providers.length) throw new AIGatewayError('No AI gateway provider is configured.', 'AI_PROVIDER_NOT_CONFIGURED', 503);

  const limit = checkRateLimit(context.actor.id, config.rateLimitMaxRequests, config.rateLimitWindowMs);
  if (!limit.ok) throw new AIGatewayError('AI rate limit reached. Try again shortly.', 'AI_RATE_LIMITED', 429);

  const messages = withHistory(request, context, config.maxHistoryMessages);
  const promptVersion = request.promptVersion ?? config.promptVersion;
  const system = buildGatewaySystemPrompt(request.system ?? '', promptVersion);
  const requestedModel = request.model ?? config.defaultModel;
  const inputMessages: AIMessage[] = [{ role: 'system', content: system }, ...messages];

  let response: Response | null = null;
  let provider: 'gateway' | 'omniroute' | 'openai' | null = null;
  let attemptedModel = requestedModel;
  const failures: string[] = [];

  for (const candidate of config.providers) {
    const body = requestBodyForProvider(candidate, request, requestedModel, config.gatewayModels, inputMessages, context, promptVersion, true);
    attemptedModel = String(body.model);
    logAIEvent('ai.request', context, {
      model: attemptedModel,
      promptVersion,
      stream: true,
      provider: candidate.id,
      fallbackModels: candidate.supportsGatewayRouting ? config.gatewayModels.length - 1 : 0,
    });
    try {
      const attempt = await fetchWithRetry(`${candidate.baseUrl}/responses`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${candidate.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      }, config.retryCount, config.requestTimeoutMs);
      if (attempt.ok && attempt.body) {
        response = attempt;
        provider = candidate.id;
        break;
      }
      failures.push(`${candidate.id}:${attemptedModel}:${attempt.status}`);
      logAIEvent('ai.provider_failover', context, { provider: candidate.id, model: attemptedModel, status: attempt.status });
    } catch (error) {
      failures.push(`${candidate.id}:${attemptedModel}:${error instanceof Error ? error.message : 'request failed'}`);
      logAIEvent('ai.provider_failover', context, { provider: candidate.id, model: attemptedModel, error: error instanceof Error ? error.message : 'request failed' });
    }
  }

  if (!response?.body || !provider) {
    throw new AIGatewayError(`AI provider streams failed: ${failures.join(', ').slice(0, 700)}`, 'AI_PROVIDER_ERROR', 502);
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-EA-AI-Provider': provider,
      'X-EA-AI-Requested-Model': requestedModel,
      'X-EA-AI-Attempted-Model': attemptedModel,
    },
  });
}
