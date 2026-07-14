import {
  clearStudioMemoryKey,
  listStudioRecords,
  loadStudioRecord,
  loadStudioRecordFromAirtable,
  saveStudioRecord,
} from '@/lib/creative-studio/persistence';
import { airtableConfigured } from '@/lib/data/airtable-client';
import { createEmptyPuckData, previewPathForPage, type ExperiencePage } from './types';

function persistedOrganizationId(organizationId: string): string {
  const value = organizationId.trim();
  if (!value || value.startsWith('org_')) {
    throw new Error('Experience Builder requires a persisted organization ID.');
  }
  return value;
}

export async function listExperiencePages(
  organizationId: string,
  portalSlug: string,
): Promise<ExperiencePage[]> {
  const orgId = persistedOrganizationId(organizationId);
  const pages = await listStudioRecords<ExperiencePage>('experience', orgId);
  return pages
    .filter((page) => page.organizationId === orgId && page.portalSlug === portalSlug)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getExperiencePage(
  pageId: string,
  organizationId?: string,
): Promise<ExperiencePage | null> {
  const page = await loadStudioRecord<ExperiencePage>('experience', pageId);
  if (!page) return null;
  if (organizationId && page.organizationId !== persistedOrganizationId(organizationId)) return null;
  return page;
}

export async function saveExperiencePage(page: ExperiencePage): Promise<ExperiencePage> {
  const organizationId = persistedOrganizationId(page.organizationId);
  const updated: ExperiencePage = {
    ...page,
    organizationId,
    updatedAt: new Date().toISOString(),
    previewPath: previewPathForPage(page.portalSlug, page.id),
  };
  const saved = await saveStudioRecord({
    recordType: 'experience',
    id: updated.id,
    organizationId,
    title: updated.title,
    payload: updated,
  });
  if (!saved.ok && airtableConfigured()) {
    throw new Error(saved.error || 'Failed to persist experience page to Airtable');
  }
  return updated;
}

/** Confirm the page exists in Airtable (not just instance memory). */
export async function verifyExperiencePageDurable(pageId: string): Promise<boolean> {
  if (!airtableConfigured()) return false;
  clearStudioMemoryKey('experience', pageId);
  const fromAirtable = await loadStudioRecordFromAirtable<ExperiencePage>('experience', pageId);
  return Boolean(fromAirtable?.id === pageId);
}

export async function createExperiencePage(
  organizationId: string,
  portalSlug: string,
  title?: string,
): Promise<ExperiencePage> {
  const orgId = persistedOrganizationId(organizationId);
  const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pageTitle = title?.trim() || 'Untitled experience';
  return saveExperiencePage({
    id,
    organizationId: orgId,
    portalSlug,
    title: pageTitle,
    status: 'draft',
    puckData: createEmptyPuckData(pageTitle),
    updatedAt: new Date().toISOString(),
    previewPath: previewPathForPage(portalSlug, id),
  });
}

export async function markExperiencePagePublished(
  pageId: string,
  organizationId: string,
): Promise<ExperiencePage | null> {
  const page = await getExperiencePage(pageId, organizationId);
  if (!page) return null;
  return saveExperiencePage({
    ...page,
    status: 'published',
    publishedAt: new Date().toISOString(),
  });
}
