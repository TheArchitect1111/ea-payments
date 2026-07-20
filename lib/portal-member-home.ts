/**
 * Member Experience home — OIB member persona/tiles as a real portal surface.
 * Stored as Creative Studio experience records (no new Airtable table).
 */
import { loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { airtableConfigured } from '@/lib/data/airtable-client';
import type { FactoryOpportunityBrief } from '@/lib/factory-opportunity-brief';

export type PortalMemberHome = {
  id: string;
  portalSlug: string;
  organizationId: string;
  organizationName: string;
  persona: string;
  purpose: string;
  talkingPoint: string;
  businessValue: string;
  tiles: string[];
  source: 'factory-oib' | 'default';
  updatedAt: string;
};

function memberHomeId(portalSlug: string): string {
  return `member-home-${portalSlug.trim().toLowerCase()}`;
}

export function buildDefaultMemberHome(input: {
  portalSlug: string;
  organizationId: string;
  organizationName: string;
}): PortalMemberHome {
  const name = input.organizationName.trim() || 'Your organization';
  return {
    id: memberHomeId(input.portalSlug),
    portalSlug: input.portalSlug.trim().toLowerCase(),
    organizationId: input.organizationId,
    organizationName: name,
    persona: 'Member',
    purpose: `A clear home for people who belong with ${name}.`,
    talkingPoint: 'One place for updates, resources, and the next step.',
    businessValue: 'Members stay oriented without chasing email threads.',
    tiles: ['Updates', 'Resources', 'Events', 'Ask'],
    source: 'default',
    updatedAt: new Date().toISOString(),
  };
}

export function buildMemberHomeFromOpportunityBrief(input: {
  portalSlug: string;
  organizationId: string;
  organizationName: string;
  brief: Pick<FactoryOpportunityBrief, 'member' | 'organization'>;
}): PortalMemberHome {
  const member = input.brief.member;
  const tiles = (member.tiles || []).map((t) => String(t).trim()).filter(Boolean);
  return {
    id: memberHomeId(input.portalSlug),
    portalSlug: input.portalSlug.trim().toLowerCase(),
    organizationId: input.organizationId,
    organizationName:
      input.organizationName.trim() ||
      input.brief.organization?.trim() ||
      'Your organization',
    persona: member.persona?.trim() || 'Member',
    purpose: member.purpose?.trim() || buildDefaultMemberHome(input).purpose,
    talkingPoint: member.talkingPoint?.trim() || '',
    businessValue: member.businessValue?.trim() || '',
    tiles: tiles.length > 0 ? tiles.slice(0, 8) : buildDefaultMemberHome(input).tiles,
    source: 'factory-oib',
    updatedAt: new Date().toISOString(),
  };
}

export async function getPortalMemberHome(
  portalSlug: string,
  organizationId?: string,
): Promise<PortalMemberHome | null> {
  const slug = portalSlug.trim().toLowerCase();
  if (!slug) return null;
  const stored = await loadStudioRecord<PortalMemberHome>('experience', memberHomeId(slug));
  if (!stored) return null;
  if (organizationId && stored.organizationId !== organizationId) return null;
  return stored;
}

export async function savePortalMemberHome(
  home: PortalMemberHome,
): Promise<PortalMemberHome> {
  const organizationId = home.organizationId.trim();
  if (!organizationId || organizationId.startsWith('org_')) {
    throw new Error('Member home requires a durable organization ID.');
  }
  const updated: PortalMemberHome = {
    ...home,
    id: memberHomeId(home.portalSlug),
    portalSlug: home.portalSlug.trim().toLowerCase(),
    organizationId,
    updatedAt: new Date().toISOString(),
  };
  const saved = await saveStudioRecord({
    recordType: 'experience',
    id: updated.id,
    organizationId,
    title: `${updated.organizationName} — Member Home`,
    payload: updated,
  });
  if (!saved.ok && airtableConfigured()) {
    throw new Error(saved.error || 'Failed to persist member home');
  }
  return updated;
}

/** Resolve home for a portal — stored OIB skin, else sensible default. */
export async function resolvePortalMemberHome(input: {
  portalSlug: string;
  organizationId: string;
  organizationName: string;
}): Promise<PortalMemberHome> {
  const existing = await getPortalMemberHome(input.portalSlug, input.organizationId);
  if (existing) return existing;
  return buildDefaultMemberHome(input);
}
