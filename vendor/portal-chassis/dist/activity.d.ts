import { AirtableRecord } from './airtable.js';

declare const ACTIVITY_EVENTS_TABLE = "ActivityEvents";
type ActivityModule = "simplifi" | "connect" | "update-hub" | "training" | "portal" | "pulse" | "system" | (string & {});
interface ActivityEventInput {
    organizationId: string;
    module: ActivityModule;
    eventType: string;
    title: string;
    summary: string;
    priority?: number;
    metric?: string;
    actionLabel?: string;
    actionUrl?: string;
    personId?: string;
    createdAt?: string;
    metadata?: Record<string, unknown>;
}
interface ActivityEvent extends Required<Pick<ActivityEventInput, "organizationId" | "module" | "eventType" | "title" | "summary">> {
    id: string;
    priority: number;
    metric?: string;
    actionLabel?: string;
    actionUrl?: string;
    personId?: string;
    createdAt: string;
    metadata: Record<string, unknown>;
}
interface ActivityEventListOptions {
    organizationId?: string;
    module?: ActivityModule;
    maxRecords?: number;
}
declare function normalizeActivityEvent(input: ActivityEventInput, id?: string): ActivityEvent;
declare function publishActivityEvent(baseId: string, tableId: string | undefined, input: ActivityEventInput): Promise<ActivityEvent>;
declare function listActivityEvents(baseId: string, tableId?: string, options?: ActivityEventListOptions): Promise<ActivityEvent[]>;
declare function fromAirtableRecord(record: AirtableRecord): ActivityEvent;

export { ACTIVITY_EVENTS_TABLE, type ActivityEvent, type ActivityEventInput, type ActivityEventListOptions, type ActivityModule, fromAirtableRecord, listActivityEvents, normalizeActivityEvent, publishActivityEvent };
