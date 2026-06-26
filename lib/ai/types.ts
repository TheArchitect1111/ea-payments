export type AIMessageRole = 'system' | 'user' | 'assistant' | 'tool';

export interface AIMessage {
  role: AIMessageRole;
  content: string;
}

export interface AIActor {
  id: string;
  type: 'admin' | 'portal' | 'system' | 'anonymous';
  email?: string;
  portalSlug?: string;
  role?: string;
}

export interface AIRequestContext {
  requestId: string;
  actor: AIActor;
  conversationId?: string;
  route?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AIGatewayRequest {
  messages: AIMessage[];
  system?: string;
  model?: string;
  temperature?: number;
  maxOutputTokens?: number;
  stream?: boolean;
  responseFormat?: 'text' | 'json';
  promptVersion?: string;
  conversationId?: string;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface AIGatewayResponse {
  ok: true;
  requestId: string;
  model: string;
  text: string;
  usage: AIUsage;
  promptVersion: string;
}

export interface AIUsage {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export interface AIErrorResponse {
  ok: false;
  requestId: string;
  error: string;
  code: string;
}
