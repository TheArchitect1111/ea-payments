import {
  embedOpportunityPayload,
  incrementViewTracking,
  parseOpportunityPayload,
  type OpportunityExperiencePayload,
  type OpportunityTracking,
} from './opportunity-experience';
import {
  getCaptureByConsiderSlug,
  saveOpportunityPayload,
  updateOpportunityExperience,
} from './capture-records';

export type ConsiderTrackEvent =
  | 'view'
  | 'assessment_started'
  | 'assessment_completed'
  | 'discovery_booked';

export async function trackConsiderEvent(
  slug: string,
  event: ConsiderTrackEvent,
  extra?: { timeOnPageSeconds?: number },
): Promise<void> {
  const capture = await getCaptureByConsiderSlug(slug);
  if (!capture) return;

  const payload = parseOpportunityPayload(capture);
  if (!payload) return;

  let tracking: OpportunityTracking = { ...payload.tracking };

  if (event === 'view') {
    tracking = incrementViewTracking(payload, extra?.timeOnPageSeconds).tracking;
  } else if (event === 'assessment_started') {
    tracking = { ...tracking, assessmentStarted: true };
  } else if (event === 'assessment_completed') {
    tracking = { ...tracking, assessmentCompleted: true };
  } else if (event === 'discovery_booked') {
    tracking = { ...tracking, discoveryBooked: true };
  }

  const updated: OpportunityExperiencePayload = { ...payload, tracking };
  const description = embedOpportunityPayload(capture.description ?? capture.analysisSummary ?? '', updated);

  const prospectStatus =
    event === 'discovery_booked'
      ? 'Discovery Booked'
      : event === 'assessment_completed'
        ? 'Assessment Completed'
        : event === 'assessment_started'
          ? 'Assessment Started'
          : tracking.views > 0
            ? 'Viewed'
            : capture.prospectStatus;

  await saveOpportunityPayload(capture.id, description, prospectStatus);
}

export async function archiveConsiderCapture(recordId: string): Promise<{ ok: boolean }> {
  if (recordId === 'demo-selena') return { ok: true };
  const result = await updateOpportunityExperience(recordId, {
    prospectStatus: 'Archived',
    status: 'Archived',
  });
  return { ok: result.ok };
}

export async function duplicateConsiderCapture(slug: string): Promise<{ ok: boolean; newSlug?: string }> {
  const capture = await getCaptureByConsiderSlug(slug);
  if (!capture) return { ok: false };

  const payload = parseOpportunityPayload(capture);
  if (!payload) return { ok: false };

  const newSlug = `${slug}-copy-${Date.now().toString(36).slice(-4)}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://ea-payments.vercel.app';
  const updated = {
    ...payload,
    prospectSlug: newSlug,
    shareUrl: `${baseUrl.replace(/\/$/, '')}/consider/${newSlug}`,
    createdAt: new Date().toISOString(),
    tracking: {
      views: 0,
      assessmentStarted: false,
      assessmentCompleted: false,
      discoveryBooked: false,
    },
  };

  const description = embedOpportunityPayload(capture.analysisSummary ?? '', updated);
  const result = await updateOpportunityExperience(capture.id, {
    considerSlug: newSlug,
    shareUrl: updated.shareUrl,
    description,
    prospectStatus: 'Shared',
  });

  return result.ok ? { ok: true, newSlug } : { ok: false };
}
