/**
 * Client-facing Guide notification + celebration templates.
 * Meaningful transitions only — no repetitive noise.
 */
import {
  GUIDE_STAGE_DEFINITIONS,
  type GuideLifecycleStage,
} from '@/lib/ctp-guide-stage-engine';
import type { PulseEvent } from '@/lib/pulse-bus';
import { designStudioPath } from '@/lib/ctp-opportunity-routes';

export type GuideClientNotice = {
  title: string;
  detail: string;
  celebrationTitle?: string;
  celebrationMessage?: string;
};

/** Stages that warrant a client-facing notice when newly completed. */
const NOTIFY_ON_COMPLETE = new Set<GuideLifecycleStage>([
  'Welcome',
  'Discovery',
  'Strategy',
  'Proposal',
  'Agreement',
  'Design',
  'Build',
  'Review',
  'Launch',
  'Care',
]);

/** Major celebration moments (warm, concise). */
const CELEBRATE_ON_COMPLETE = new Set<GuideLifecycleStage>([
  'Discovery',
  'Proposal',
  'Agreement',
  'Build',
  'Launch',
]);

export function guideNoticeForCompletedStage(
  stage: GuideLifecycleStage,
): GuideClientNotice | null {
  if (!NOTIFY_ON_COMPLETE.has(stage)) return null;
  const def = GUIDE_STAGE_DEFINITIONS[stage];
  if (!def.notification) return null;

  const celebrate = CELEBRATE_ON_COMPLETE.has(stage) ? def.celebration : undefined;
  return {
    title: def.notification.title,
    detail: def.notification.detail,
    celebrationTitle: celebrate?.title,
    celebrationMessage: celebrate?.message,
  };
}

export function guideStageAdvancedPulse(input: {
  submissionId: string;
  portalSlug: string;
  businessName: string;
  from: GuideLifecycleStage;
  to: GuideLifecycleStage;
  newlyCompleted: GuideLifecycleStage[];
}): PulseEvent {
  const href = input.portalSlug ? designStudioPath(input.portalSlug) : undefined;
  return {
    product: 'ea-platform',
    type: 'guide.stage.advanced',
    title: `${input.businessName || 'Project'}: now in ${input.to}`,
    detail: `Moved from ${input.from} to ${input.to}.`,
    priority: 'medium',
    href,
    objectId: input.submissionId,
    tenantId: input.portalSlug || undefined,
    metadata: {
      fromStage: input.from,
      toStage: input.to,
      newlyCompleted: input.newlyCompleted.join(','),
      source: 'guide-orchestration',
    },
  };
}

export function guideMilestonePulse(input: {
  submissionId: string;
  portalSlug: string;
  businessName: string;
  stage: GuideLifecycleStage;
  notice: GuideClientNotice;
}): PulseEvent {
  const href = input.portalSlug ? designStudioPath(input.portalSlug) : undefined;
  return {
    product: 'ea-platform',
    type: 'guide.milestone.completed',
    title: input.notice.title,
    detail: input.notice.detail,
    priority: 'medium',
    href,
    objectId: `${input.submissionId}:${input.stage}:complete`,
    tenantId: input.portalSlug || undefined,
    metadata: {
      stage: input.stage,
      businessName: input.businessName,
      source: 'guide-orchestration',
    },
  };
}

export function guideCelebratePulse(input: {
  submissionId: string;
  portalSlug: string;
  stage: GuideLifecycleStage;
  notice: GuideClientNotice;
}): PulseEvent {
  const href = input.portalSlug ? designStudioPath(input.portalSlug) : undefined;
  return {
    product: 'ea-platform',
    type: 'guide.celebrate',
    title: input.notice.celebrationTitle ?? input.notice.title,
    detail: input.notice.celebrationMessage ?? input.notice.detail,
    priority: 'high',
    href,
    objectId: `${input.submissionId}:${input.stage}:celebrate`,
    tenantId: input.portalSlug || undefined,
    metadata: {
      stage: input.stage,
      source: 'guide-orchestration',
    },
  };
}

export function guideClientEmail(input: {
  to: string;
  businessName: string;
  notice: GuideClientNotice;
  progressHref: string;
}): { to: string; subject: string; html: string } {
  const headline = input.notice.celebrationTitle ?? input.notice.title;
  const body = input.notice.celebrationMessage ?? input.notice.detail;
  return {
    to: input.to,
    subject: `${headline} — ${input.businessName || 'Your project'}`,
    html: `
      <div style="font-family:Georgia,serif;line-height:1.5;color:#1a2332;max-width:560px">
        <p style="font-size:18px;margin:0 0 12px">${escapeHtml(headline)}</p>
        <p style="margin:0 0 16px">${escapeHtml(body)}</p>
        <p style="margin:0 0 20px">${escapeHtml(input.notice.detail)}</p>
        <p style="margin:0">
          <a href="${escapeAttr(input.progressHref)}" style="color:#8a6d1d">Open your project Progress</a>
        </p>
      </div>
    `.trim(),
  };
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function escapeAttr(value: string): string {
  return escapeHtml(value).replace(/'/g, '&#39;');
}
