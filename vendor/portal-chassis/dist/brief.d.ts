import { ActivityEvent } from './activity.js';
import './airtable.js';

interface BriefRequest {
    organizationId: string;
    userId?: string;
    role?: string;
    module?: string;
    time?: string | Date;
    userName?: string;
}
interface BriefCard {
    id: string;
    title: string;
    summary: string;
    metric: string;
    actionLabel: string;
    actionUrl?: string;
    module: string;
    eventType: string;
    priority: number;
    score: number;
    personId?: string;
    createdAt: string;
    metadata: Record<string, unknown>;
}
interface BriefResponse {
    greeting: string;
    topPriority?: BriefCard;
    todaysActivity: BriefCard[];
    recommendedActions: BriefCard[];
    recentEvents: BriefCard[];
    quickActions: BriefAction[];
    cards: BriefCard[];
}
interface BriefAction {
    label: string;
    href: string;
    module?: string;
}
declare function buildBriefResponse(events: ActivityEvent[], request: BriefRequest, quickActions?: BriefAction[]): BriefResponse;
declare function selectBriefCards(events: ActivityEvent[], request: BriefRequest, limit?: number): BriefCard[];
declare function scoreActivityEvent(event: ActivityEvent, request?: BriefRequest): number;
declare function toBriefCard(event: ActivityEvent, request: BriefRequest, now?: Date): BriefCard;

export { type BriefAction, type BriefCard, type BriefRequest, type BriefResponse, buildBriefResponse, scoreActivityEvent, selectBriefCards, toBriefCard };
