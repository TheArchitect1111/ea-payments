import { ActivityEvent } from './activity.cjs';
import { PlatformEvent } from './platform-events.cjs';
import './airtable.cjs';

/**
 * Agent activity layer — agents publish PlatformEvents with module='agent'.
 * v1: event contract + registry; real orchestration plugs in later.
 */

type AgentKind = 'research' | 'proposal' | 'qa' | 'training' | 'content' | 'launch' | 'deployment' | (string & {});
type AgentRunStatus = 'queued' | 'running' | 'paused' | 'review_required' | 'completed' | 'failed' | 'cancelled';
interface AgentRunInput {
    organizationId: string;
    agentKind: AgentKind;
    task: string;
    status?: AgentRunStatus;
    progress?: number;
    estimatedCompletion?: string;
    reviewRequired?: boolean;
    actionUrl?: string;
    clientSlug?: string;
    projectId?: string;
    metadata?: Record<string, unknown>;
}
interface AgentRun extends PlatformEvent {
    agentKind: AgentKind;
    status: AgentRunStatus;
    task: string;
    progress: number;
    estimatedCompletion?: string;
    reviewRequired: boolean;
}
interface AgentDefinition {
    kind: AgentKind;
    label: string;
    description: string;
}
/** Built-in EA agent registry (extend per deploy). */
declare const EA_AGENT_REGISTRY: AgentDefinition[];
declare function publishAgentRun(baseId: string, tableId: string | undefined, input: AgentRunInput): Promise<AgentRun>;
declare function listAgentRuns(baseId: string, tableId: string | undefined, organizationId: string, maxRecords?: number): Promise<AgentRun[]>;
declare function toAgentRun(event: ActivityEvent): AgentRun;
declare function isActiveAgent(run: AgentRun): boolean;

export { type AgentDefinition, type AgentKind, type AgentRun, type AgentRunInput, type AgentRunStatus, EA_AGENT_REGISTRY, isActiveAgent, listAgentRuns, publishAgentRun, toAgentRun };
