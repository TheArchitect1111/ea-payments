import { getClientByPortalSlug } from '@/lib/airtable';
import { loadSimplifiWorkspace } from '@/lib/simplifi-core';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { emptyActionCenter, emptyBriefSlice, type OrbBriefSlice } from '@/lib/orb';
import type { ActionCenterPayload } from '@/lib/action-center';
import type { SimplifiObject } from '@/lib/simplifi-objects';

export async function loadOrbWorkspaceSlice(slug: string | null): Promise<{
  brief: OrbBriefSlice;
  objects: SimplifiObject[];
  actionCenter: ActionCenterPayload;
  firstName: string;
}> {
  if (!slug) {
    return {
      brief: emptyBriefSlice(),
      objects: [],
      actionCenter: emptyActionCenter(),
      firstName: '',
    };
  }
  const client = await getClientByPortalSlug(slug);
  const firstName = client?.clientName?.split(' ')[0] ?? '';
  const workspace = await loadSimplifiWorkspace(slug, EA_PLATFORM_URL, firstName);
  return {
    brief: workspace.brief,
    objects: workspace.activeObjects,
    actionCenter: workspace.actionCenter,
    firstName,
  };
}
