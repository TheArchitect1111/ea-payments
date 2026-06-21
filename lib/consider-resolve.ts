import { getCaptureByConsiderSlug, getCaptureByIdentifier } from './capture-records';
import {
  buildDemoSelenaPayload,
  DEMO_CONSIDER_SLUG,
  ensureDemoConsiderSelena,
} from './demo-consider-selena';
import { parseOpportunityPayload, type OpportunityExperiencePayload } from './opportunity-experience';

export interface ResolvedConsiderExperience {
  payload: OpportunityExperiencePayload;
  captureId: string;
  source: 'airtable' | 'demo-static';
}

export async function resolveConsiderExperience(slug: string): Promise<ResolvedConsiderExperience | null> {
  const trimmed = slug.trim().toLowerCase();
  if (!trimmed) return null;

  let capture = await getCaptureByConsiderSlug(trimmed);

  if (!capture && trimmed === DEMO_CONSIDER_SLUG) {
    await ensureDemoConsiderSelena();
    capture = await getCaptureByConsiderSlug(trimmed);
    if (!capture) {
      capture = await getCaptureByIdentifier('CAP-DEMO-SELENA');
    }
  }

  if (capture) {
    const payload = parseOpportunityPayload(capture);
    if (payload) {
      return { payload, captureId: capture.id, source: 'airtable' };
    }
  }

  if (trimmed === DEMO_CONSIDER_SLUG) {
    return {
      payload: buildDemoSelenaPayload(),
      captureId: 'demo-selena',
      source: 'demo-static',
    };
  }

  return null;
}
