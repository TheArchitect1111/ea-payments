/**
 * Website + Portal provisioner — thin adapter to the unified publish gate.
 * All callers must go through publishWebsiteThroughDirectorGate (no bypass).
 */
import type { Data } from '@measured/puck';
import { publicPortalLoginUrl } from '@/lib/ctp-portal-host';
import { composeDirectedWebsite } from '@/lib/layout-composer';
import {
  findPublishedSitePage,
  publishWebsiteThroughDirectorGate,
  sitePathForSlug,
  siteUrlForSlug,
  type WebsitePortalProvisionInput,
  type WebsitePublishGateResult,
} from '@/lib/website-publish-gate';

export type { WebsitePortalProvisionInput };
export type WebsitePortalProvisionResult = WebsitePublishGateResult;

export { sitePathForSlug, siteUrlForSlug, findPublishedSitePage };

function buildDefaultAboutBody(input: {
  brand: string;
  industry?: string;
  existingWebsiteUrl?: string;
}): string {
  const base = input.industry
    ? `${input.brand} helps people in ${input.industry} move from interest to action with a clear offer and guided next steps.`
    : `${input.brand} helps people move from interest to action with a clear offer, proof, and a simple next step.`;
  if (input.existingWebsiteUrl) {
    return `${base}\n\nCurrent presence: ${input.existingWebsiteUrl}`;
  }
  return base;
}

/**
 * Directed homepage puckData (preview / contracts). Publish still requires the unified gate.
 */
export function buildStarterWebsitePuckData(input: WebsitePortalProvisionInput): Data {
  const brand = input.organizationName?.trim() || input.businessName.trim() || 'Your Business';
  const industry = input.industry?.trim();
  const existingWebsiteUrl = input.existingWebsiteUrl?.trim() || undefined;
  const aboutBody =
    input.aboutBody?.trim() ||
    buildDefaultAboutBody({ brand, industry, existingWebsiteUrl });
  const portalLogin = input.portalLoginHref || publicPortalLoginUrl(input.portalSlug);
  const sitePath = sitePathForSlug(input.portalSlug);

  const { puckData, director, composed } = composeDirectedWebsite({
    organization: {
      organizationName: brand,
      industry,
      primaryAudience: input.primaryAudience || input.whoTheyHelp,
      whoTheyAre: input.whoTheyAre || aboutBody,
      mission: input.mission || input.whyTheyExist,
      story: input.story,
      whyTheyExist: input.whyTheyExist || input.mission,
      whoTheyHelp: input.whoTheyHelp || input.primaryAudience,
      whyItMatters: input.whyItMatters,
      whatChanges: input.whatChanges,
      differentiators: input.differentiators,
      brandHeadline: input.headline?.trim() || brand,
      brandSubhead: input.tagline?.trim(),
      brandCta: input.ctaLabel?.trim(),
      brandVoice: input.brandVoice,
      primaryColor: input.primaryColor?.trim(),
      accentColor: input.accentColor?.trim(),
      portalLoginHref: portalLogin,
      sitePath,
      member: input.member,
    },
    portalLoginHref: portalLogin,
    sitePath,
    primaryColor: input.primaryColor?.trim(),
    accentColor: input.accentColor?.trim(),
  });

  const rootProps = {
    ...((puckData.root as { props?: Record<string, unknown> } | undefined)?.props || {}),
    storyClassification: director.classification,
    creativeDirection: director.creativeDirection,
    scenePlan: composed.scenes.map((item) => ({
      role: item.role,
      compositionId: item.compositionId,
      job: item.scene.job,
    })),
    compositionSignature: composed.compositionSignature,
  };
  return {
    ...puckData,
    root: {
      ...(puckData.root || {}),
      props: {
        ...rootProps,
        themeId: input.themeId?.trim() || 'ea-default-theme',
      },
    } as Data['root'],
  };
}

/** Sole production publish entry — delegates to unified Director gate. */
export async function provisionWebsitePortalSite(
  input: WebsitePortalProvisionInput,
): Promise<WebsitePortalProvisionResult> {
  return publishWebsiteThroughDirectorGate(input);
}
