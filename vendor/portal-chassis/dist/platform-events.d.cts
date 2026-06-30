import { ActivityEvent, ActivityEventInput } from './activity.cjs';
import { AirtableRecord } from './airtable.cjs';

/**
 * Unified platform event contract — converges Pulse Events and ActivityEvents
 * into one shape Mission Control renders. Write path: normalize → ActivityEvents.
 */

/** Canonical event shape for attention, agents, and momentum. */
type PlatformEventSource = 'activity' | 'pulse' | 'agent';
type PlatformEventCategory = 'attention' | 'agent' | 'continue' | 'momentum' | 'activity';
interface PlatformEvent extends ActivityEvent {
    source: PlatformEventSource;
    category: PlatformEventCategory;
    /** Human-readable explainability for AI recommendations. */
    whyRecommended?: string;
}
/** Loose Pulse Events row shape from ea-payments `pulse-bus`. */
interface PulseEventRow {
    id?: string;
    organizationId?: string;
    clientSlug?: string;
    clientId?: string;
    eventType?: string;
    type?: string;
    title?: string;
    summary?: string;
    description?: string;
    priority?: number;
    module?: string;
    metric?: string;
    actionLabel?: string;
    actionUrl?: string;
    personId?: string;
    createdAt?: string;
    metadata?: Record<string, unknown> | string;
}
/** Map a Pulse Events Airtable record to the unified contract. */
declare function fromPulseAirtableRecord(record: AirtableRecord): PlatformEvent;
declare function fromPulseEventRow(row: PulseEventRow, id?: string): PlatformEvent;
/** Promote an ActivityEvent to the unified contract (no data loss). */
declare function fromActivityEvent(event: ActivityEvent): PlatformEvent;
/** Normalize any platform event for ActivityEvents persistence. */
declare function toActivityEventInput(event: PlatformEvent): ActivityEventInput;
/** Merge pulse + activity streams, dedupe by id, sort by recency. */
declare function mergeEventStreams(activity: ActivityEvent[], pulse?: PlatformEvent[]): PlatformEvent[];

export { type PlatformEvent, type PlatformEventCategory, type PlatformEventSource, type PulseEventRow, fromActivityEvent, fromPulseAirtableRecord, fromPulseEventRow, mergeEventStreams, toActivityEventInput };
