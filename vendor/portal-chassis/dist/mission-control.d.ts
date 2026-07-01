import { BriefResponse, BriefCard, BriefRequest, BriefAction } from './brief.js';
import { PlatformEvent } from './platform-events.js';
import { AgentRun } from './agents.js';
import { ActivityEvent } from './activity.js';
import './airtable.js';

/**
 * Mission Control engine — extends Brief with intent, continue-working,
 * action cards, agent panel, and momentum. Renders ranked attention, not menus.
 */

interface MissionControlRequest extends BriefRequest {
    userId?: string;
    role?: 'executive' | 'builder' | string;
}
interface ContinueWorkingItem {
    id: string;
    title: string;
    summary: string;
    href: string;
    module: string;
    lastActiveAt: string;
}
interface ActionCard {
    id: string;
    label: string;
    href: string;
    intent: string;
    module?: string;
}
interface MomentumStat {
    label: string;
    value: number;
    unit?: string;
}
interface MissionControlResponse extends BriefResponse {
    /** Example intents for the command bar placeholder. */
    intentExamples: string[];
    /** Ranked attention — same as brief cards, explicit alias for Mission Control. */
    todaysFocus: BriefCard[];
    continueWorking: ContinueWorkingItem[];
    actionCards: ActionCard[];
    agentRuns: AgentRun[];
    activeAgents: AgentRun[];
    momentum: MomentumStat[];
}
/** Default EA executive action cards — override per deploy. */
declare const DEFAULT_ACTION_CARDS: ActionCard[];
declare const DEFAULT_INTENT_EXAMPLES: string[];
declare function buildMissionControlResponse(events: PlatformEvent[], request: MissionControlRequest, options?: {
    actionCards?: ActionCard[];
    quickActions?: BriefAction[];
    intentExamples?: string[];
    agentRuns?: AgentRun[];
}): MissionControlResponse;
/** Build from separate pulse + activity streams (ea-payments adapter path). */
declare function buildMissionControlFromStreams(activity: ActivityEvent[], pulse: PlatformEvent[], request: MissionControlRequest, options?: Parameters<typeof buildMissionControlResponse>[2]): MissionControlResponse;

export { type ActionCard, type ContinueWorkingItem, DEFAULT_ACTION_CARDS, DEFAULT_INTENT_EXAMPLES, type MissionControlRequest, type MissionControlResponse, type MomentumStat, buildMissionControlFromStreams, buildMissionControlResponse };
