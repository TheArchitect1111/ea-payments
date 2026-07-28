/**
 * Simplifi core workspace loader — server-side business logic for all clients.
 */
import { getPortalCaptures } from '@/lib/capture-records';
import {
  captureToObject,
  sortInbox,
  type SimplifiObject,
} from '@/lib/simplifi-objects';
import { objectsToMemoryLibrary } from '@/lib/memory-assets';
import { buildActionCenter } from '@/lib/action-center';
import { buildRelationshipClusters } from '@/lib/relationship-hints';
import { isTerminalOutcome } from '@/lib/outcome-tracking';
import { computePriorityScore } from '@/lib/priority-engine';
import { buildMergedDailyBrief, type MergedDailyBrief } from '@/lib/simplifi-os';

export interface SimplifiWorkspaceData {
  objects: SimplifiObject[];
  activeObjects: SimplifiObject[];
  brief: MergedDailyBrief;
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

  const brief = await buildMergedDailyBrief({
    objects,
    firstName,
    portalSlug,
  });

  return {
    objects,
    activeObjects,
    brief,
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
