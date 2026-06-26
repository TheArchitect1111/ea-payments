import { getAIGatewayConfig } from '@/lib/ai/config';
import { logAIEvent, trackAIUsage } from '@/lib/ai/logging';
import { checkRateLimit } from '@/lib/ai/rate-limit';
import { buildGatewaySystemPrompt, detectPromptInjection } from '@/lib/ai/security';
import type { AIGatewayRequest, AIGatewayResponse, AIMessage, AIRequestContext, AIUsage } from '@/lib/ai/types';

const conversationHistory = new Map<string, AIMessage[]>();

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

function openAIInput(messages: AIMessage[]) {
  return messages.map((message) => ({
    role: message.role === 'tool' ? 'user' : message.role,
    content: message.content,
  }));
}

function withHistory(request: AIGatewayRequest, maxHistoryMessages: number): AIMessage[] {
  if (!request.conversationId) return request.messages;
  const stored = conversationHistory.get(request.conversationId) ?? [];
  return [...stored, ...request.messages].slice(-maxHistoryMessages);
}

function saveHistory(conversationId: string | undefined, messages: AIMessage[], assistantText: string, maxHistoryMessages: number) {
  if (!conversationId) return;
  const assistantMessage: AIMessage = { role: 'assistant', content: assistantText };
  conversationHistory.set(conversationId, [...messages, assistantMessage].slice(-maxHistoryMessages));
}

async function fetchWithRetry(url: string, init: RequestInit, retries: number, timeoutMs: number) {
  let lastError: unknown;
  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timeout);
      if (response.ok || response.status < 500 || attempt === retries) return response;
    } catch (err) {
      clearTimeout(timeout);
      lastError = err;
      if (attempt === retries) throw err;
    }
  }
  throw lastError instanceof Error ? lastError : new Error('AI request failed.');
}

export async function runAIGateway(request: AIGatewayRequest, context: AIRequestContext): Promise<AIGatewayResponse> {
  const config = getAIGatewayConfig();
  if (!config.apiKey) throw new AIGatewayError('OPENAI_API_KEY is not configured.', 'AI_PROVIDER_NOT_CONFIGURED', 503);

  const limit = checkRateLimit(context.actor.id, config.rateLimitMaxRequests, config.rateLimitWindowMs);
  if (!limit.ok) throw new AIGatewayError('AI rate limit reached. Try again shortly.', 'AI_RATE_LIMITED', 429);

  const messages = withHistory(request, config.maxHistoryMessages);
  const injectionSignals = detectPromptInjection(messages);
  if (injectionSignals.length) {
    logAIEvent('ai.prompt_injection_signal', context, { signals: injectionSignals.length });
  }

  const promptVersion = request.promptVersion ?? config.promptVersion;
  const system = buildGatewaySystemPrompt(request.system ?? '', promptVersion);
  const model = request.model ?? config.defaultModel;
  const inputMessages: AIMessage[] = [{ role: 'system', content: system }, ...messages];
  const body = {
    model,
    input: openAIInput(inputMessages),
    temperature: request.temperature ?? 0.2,
    max_output_tokens: request.maxOutputTokens ?? 1200,
    text: request.responseFormat === 'json' ? { format: { type: 'json_object' } } : undefined,
    metadata: {
      requestId: context.requestId,
      actorType: context.actor.type,
      route: context.route ?? 'unknown',
      promptVersion,
      ...request.metadata,
    },
  };

  logAIEvent('ai.request', context, { model, promptVersion, stream: false });
  const response = await fetchWithRetry(`${config.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  }, config.retryCount, config.requestTimeoutMs);

  if (!response.ok) {
    const detail = await response.text();
    throw new AIGatewayError(`AI provider request failed: ${detail.slice(0, 500)}`, 'AI_PROVIDER_ERROR', response.status);
  }

  const data = await response.json();
  const text = textFromOpenAI(data);
  const usage = usageFromOpenAI(data.usage);
  saveHistory(request.conversationId, messages, text, config.maxHistoryMessages);
  trackAIUsage(context, model, usage);

  return { ok: true, requestId: context.requestId, model, text, usage, promptVersion };
}

export async function streamAIGateway(request: AIGatewayRequest, context: AIRequestContext): Promise<Response> {
  const config = getAIGatewayConfig();
  if (!config.apiKey) throw new AIGatewayError('OPENAI_API_KEY is not configured.', 'AI_PROVIDER_NOT_CONFIGURED', 503);

  const limit = checkRateLimit(context.actor.id, config.rateLimitMaxRequests, config.rateLimitWindowMs);
  if (!limit.ok) throw new AIGatewayError('AI rate limit reached. Try again shortly.', 'AI_RATE_LIMITED', 429);

  const messages = withHistory(request, config.maxHistoryMessages);
  const promptVersion = request.promptVersion ?? config.promptVersion;
  const system = buildGatewaySystemPrompt(request.system ?? '', promptVersion);
  const model = request.model ?? config.defaultModel;
  const inputMessages: AIMessage[] = [{ role: 'system', content: system }, ...messages];

  logAIEvent('ai.request', context, { model, promptVersion, stream: true });
  const response = await fetchWithRetry(`${config.baseUrl}/responses`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model,
      input: openAIInput(inputMessages),
      temperature: request.temperature ?? 0.2,
      max_output_tokens: request.maxOutputTokens ?? 1200,
      stream: true,
    }),
  }, config.retryCount, config.requestTimeoutMs);

  if (!response.ok || !response.body) {
    const detail = await response.text();
    throw new AIGatewayError(`AI provider stream failed: ${detail.slice(0, 500)}`, 'AI_PROVIDER_ERROR', response.status);
  }

  return new Response(response.body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
    },
  });
}
