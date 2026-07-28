/** Shared types for Simplifi Personal Opportunity OS (lib/simplifi-os). */

export type SimplifiObjectType =
  | 'person'
  | 'organization'
  | 'project'
  | 'opportunity'
  | 'meeting'
  | 'task'
  | 'idea'
  | 'note'
  | 'photo'
  | 'document'
  | 'email'
  | 'calendar_event'
  | 'url'
  | 'website'
  | 'other';

export type MemoryEventType =
  | 'capture.created'
  | 'capture.viewed'
  | 'capture.edited'
  | 'capture.shared'
  | 'capture.referenced'
  | 'reminder.created'
  | 'reminder.completed'
  | 'reminder.ignored'
  | 'search.performed'
  | 'opportunity.created'
  | 'opportunity.updated'
  | 'meeting.referenced'
  | 'conversation.referenced'
  | 'person.linked'
  | 'document.linked'
  | 'relationship.upserted'
  | 'relationship.dismissed'
  | 'ask.answered'
  | 'intelligence.finding'
  | 'sync.flushed';

export type MemoryActorType = 'user' | 'system' | 'ai' | 'device';
export type MemoryClient = 'web' | 'mobile' | 'extension' | 'system';

export type RecordMemoryEventInput = {
  portalSlug: string;
  eventType: MemoryEventType;
  actorId?: string;
  actorType?: MemoryActorType;
  client?: MemoryClient;
  objectId?: string;
  objectIds?: string[];
  relatedObjectIds?: string[];
  correlationId?: string;
  metadata?: Record<string, unknown>;
  /** Legacy pulse-compatible payload blob */
  payload?: Record<string, unknown>;
};

export type MemoryEventRow = RecordMemoryEventInput & {
  id: string;
  createdAt: string;
};

export type TimelineScope =
  | 'user'
  | 'opportunity'
  | 'person'
  | 'company'
  | 'project'
  | 'meeting'
  | 'document';

export type ContextPack = {
  objectId: string;
  relatedPeople: Array<{ id: string; title: string }>;
  relatedOpportunities: Array<{ id: string; title: string }>;
  relatedMeetings: Array<{ id: string; title: string }>;
  relatedFiles: Array<{ id: string; title: string }>;
  relatedNotes: Array<{ id: string; title: string }>;
  timeline: MemoryEventRow[];
  opportunityScore: number | null;
  aiSummary: string | null;
  recommendations: string[];
  nextBestAction: string | null;
};

export type IntelligenceFindingType =
  | 'forgotten_commitment'
  | 'stalled_opportunity'
  | 'relationship_gap'
  | 'repeated_idea'
  | 'emerging_opportunity'
  | 'momentum'
  | 'inactive_client'
  | 'pending_promise'
  | 'duplicate_work'
  | 'upcoming_deadline';

export type IntelligenceFinding = {
  type: IntelligenceFindingType;
  title: string;
  detail: string;
  objectIds: string[];
  nextBestAction?: string;
  confidence: number;
};
