import { listStudioRecords, loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';
import { createEmptyPuckData, previewPathForPage, type ExperiencePage } from './types';

function orgIdForSlug(portalSlug: string): string {
  return syntheticOrgId(portalSlug);
}

export async function listExperiencePages(portalSlug: string): Promise<ExperiencePage[]> {
  const organizationId = orgIdForSlug(portalSlug);
  const pages = await listStudioRecords<ExperiencePage>('experience', organizationId);
  return pages
    .filter((page) => page.portalSlug === portalSlug)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export async function getExperiencePage(pageId: string): Promise<ExperiencePage | null> {
  return loadStudioRecord<ExperiencePage>('experience', pageId);
}

export async function saveExperiencePage(page: ExperiencePage): Promise<ExperiencePage> {
  const updated: ExperiencePage = {
    ...page,
    updatedAt: new Date().toISOString(),
    previewPath: previewPathForPage(page.portalSlug, page.id),
  };
  await saveStudioRecord({
    recordType: 'experience',
    id: updated.id,
    organizationId: updated.organizationId,
    title: updated.title,
    payload: updated,
  });
  return updated;
}

export async function createExperiencePage(portalSlug: string, title?: string): Promise<ExperiencePage> {
  const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const pageTitle = title?.trim() || 'Untitled experience';
  const page: ExperiencePage = {
    id,
    organizationId: orgIdForSlug(portalSlug),
    portalSlug,
    title: pageTitle,
    status: 'draft',
    puckData: createEmptyPuckData(pageTitle),
    updatedAt: new Date().toISOString(),
    previewPath: previewPathForPage(portalSlug, id),
  };
  return saveExperiencePage(page);
}

export async function markExperiencePagePublished(pageId: string): Promise<ExperiencePage | null> {
  const page = await getExperiencePage(pageId);
  if (!page) return null;
  return saveExperiencePage({
    ...page,
    status: 'published',
    publishedAt: new Date().toISOString(),
  });
}
