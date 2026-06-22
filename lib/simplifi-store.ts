/**
 * Simplifi object store — Airtable today, Supabase Phase 2.
 * All workspace reads go through here so the backend can swap without UI changes.
 */
import { getPortalCaptures } from './capture-records';
import {
  captureToObject,
  sortInbox,
  buildDailyBrief,
  type SimplifiObject,
} from './simplifi-objects';
import { objectsToMemoryLibrary } from './memory-assets';
import { buildActionCenter } from './action-center';
import { buildRelationshipClusters } from './relationship-hints';
import { isTerminalOutcome } from './outcome-tracking';
import { computePriorityScore } from './priority-engine';

export interface SimplifiWorkspaceData {
  objects: SimplifiObject[];
  activeObjects: SimplifiObject[];
  brief: ReturnType<typeof buildDailyBrief>;
  memoryLibrary: ReturnType<typeof objectsToMemoryLibrary>;
  actionCenter: ReturnType<typeof buildActionCenter>;
  relationships: ReturnType<typeof buildRelationshipClusters>;
}

export async function loadSimplifiWorkspace(
  portalSlug: string,
  baseUrl: string,
  firstName = '',
  limit = 30,
): Promise<SimplifiWorkspaceData> {
  const captures = await getPortalCaptures(portalSlug, limit);
  const objects = sortInbox(
    captures
      .filter((c) => c.status !== 'Archived')
      .map((c) => enrichObject(captureToObject(c, baseUrl))),
  );

  const activeObjects = objects.filter((o) => !isTerminalOutcome(o.outcomeStatus));

  return {
    objects,
    activeObjects,
    brief: buildDailyBrief(objects, firstName, portalSlug),
    memoryLibrary: objectsToMemoryLibrary(activeObjects),
    actionCenter: buildActionCenter(activeObjects),
    relationships: buildRelationshipClusters(activeObjects),
  };
}

function enrichObject(obj: SimplifiObject): SimplifiObject {
  const ps = computePriorityScore(obj);
  return { ...obj, priorityScore: ps.score, priorityLevel: ps.level };
}

export type { SimplifiObject };
