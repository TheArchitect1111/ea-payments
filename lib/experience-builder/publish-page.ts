import { publishCommunication } from '@/lib/publishing';
import { publishPlatformActivityEvent } from '@/lib/activity-events-store';
import { getExperiencePage, markExperiencePagePublished } from './page-store';
import { previewPathForPage } from './types';

export async function publishExperiencePage(input: {
  pageId: string;
  portalSlug: string;
  actorName?: string;
}) {
  const page = await getExperiencePage(input.pageId);
  if (!page) {
    return { ok: false as const, detail: 'Experience page not found.' };
  }
  if (page.portalSlug !== input.portalSlug) {
    return { ok: false as const, detail: 'Portal access denied for this page.' };
  }

  const previewPath = previewPathForPage(input.portalSlug, input.pageId);
  const actor = input.actorName ?? 'Experience Builder';
  const summary = page.puckData.content
    .slice(0, 3)
    .map((block) => {
      const props = block.props as Record<string, unknown>;
      return String(props.title ?? props.eyebrow ?? block.type);
    })
    .filter(Boolean)
    .join(' · ');

  const outcome = await publishCommunication({
    channel: 'website',
    portalSlug: input.portalSlug,
    title: page.title,
    body: summary || page.title,
    summary: `Experience page with ${page.puckData.content.length} section(s).`,
    requestType: 'Landing Page',
    storyUrl: previewPath,
    actorName: actor,
    source: { product: 'experience-builder', campaignId: page.id, assetId: page.id },
  });

  const updated = await markExperiencePagePublished(input.pageId);

  if (outcome.ok && updated) {
    await publishPlatformActivityEvent({
      organizationId: page.organizationId,
      module: 'landing',
      eventType: 'experience-builder.publish',
      title: `Published ${page.title}`,
      summary: outcome.detail,
      actionLabel: 'Preview page',
      actionUrl: previewPath,
      metadata: { pageId: page.id, portalSlug: input.portalSlug, actorName: actor },
    }).catch(() => undefined);
  }

  return {
    ok: outcome.ok,
    detail: outcome.detail,
    href: outcome.href ?? previewPath,
    page: updated,
    mode: outcome.mode,
  };
}
