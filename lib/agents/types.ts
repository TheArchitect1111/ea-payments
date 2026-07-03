import type { AIGatewayRequest, AIGatewayResponse, AIRequestContext } from '@/lib/ai/types';

export type AgentStatus = 'available' | 'degraded' | 'disabled';

export interface AgentPermission {
  id: string;
  description: string;
}

export interface AgentExecutionInput {
  intent: string;
  query: string;
  context?: Record<string, unknown>;
  conversationId?: string;
}

export interface AgentFinding {
  title: string;
  detail: string;
}

export interface AgentExecutionResult {
  agent: string;
  summary: string;
  keyFindings: AgentFinding[];
  opportunities: AgentFinding[];
  risks: AgentFinding[];
  recommendedNextSteps: string[];
  confidence: number;
  sources: string[];
  raw?: unknown;
}

export interface AgentHealth {
  name: string;
  status: AgentStatus;
  checkedAt: string;
  details?: string;
}

export interface AgentRuntime {
  gateway: (request: AIGatewayRequest, context: AIRequestContext) => Promise<AIGatewayResponse>;
}

export interface EAAgent {
  name: string;
  description: string;
  capabilities: string[];
  permissions: AgentPermission[];
  execute(input: AgentExecutionInput, context: AIRequestContext, runtime?: Partial<AgentRuntime>): Promise<AgentExecutionResult>;
  health(): Promise<AgentHealth>;
  status(): AgentStatus;
}

export interface OrchestratorRequest {
  message: string;
  intent?: string;
  context?: Record<string, unknown>;
  conversationId?: string;
  requestedAgents?: string[];
  maxAgents?: number;
}

export interface OrchestratorResponse {
  ok: true;
  requestId: string;
  response: {
    summary: string;
    keyFindings: AgentFinding[];
    opportunities: AgentFinding[];
    risks: AgentFinding[];
    recommendedNextSteps: string[];
    confidence: number;
    sources: string[];
  };
  agents: Array<{ name: string; status: AgentStatus }>;
}
