import type { PortalWorkspaceChrome } from '@/lib/platform/portal-workspace';
import type { IndustryPack } from '@/lib/portal-universal/industry-pack';

/**
 * Merge IndustryPack branding onto chrome.
 * Org logo already on chrome wins over pack.logoSrc (caller should set org logo first).
 */
export function applyPackBrandingToChrome(
  chrome: PortalWorkspaceChrome,
  pack: IndustryPack,
  opts?: { orgHasLogo?: boolean },
): PortalWorkspaceChrome {
  const branding = pack.branding;
  if (!branding) return chrome;

  const next = { ...chrome };

  if (branding.workspaceName?.trim()) next.workspaceName = branding.workspaceName.trim();
  if (branding.brandName?.trim()) next.brandName = branding.brandName.trim();
  if (branding.themeId?.trim()) next.themeId = branding.themeId.trim();
  if (branding.personalityId?.trim()) next.personalityId = branding.personalityId.trim();

  const t = branding.terminology;
  if (t?.members?.trim()) next.memberLabel = t.members.trim();
  if (t?.home?.trim()) next.homeLabel = t.home.trim();
  if (t?.startPrompt?.trim()) {
    next.promoTitle = 'Start here';
    next.promoCopy = t.startPrompt.trim();
  }
  if (t?.focus?.trim()) next.focusLabel = t.focus.trim();
  if (t?.attention?.trim()) next.attentionLabel = t.attention.trim();
  if (t?.start?.trim()) next.startLabel = t.start.trim();

  if (!opts?.orgHasLogo && branding.logoSrc?.trim()) {
    next.logoSrc = branding.logoSrc.trim();
  }

  return next;
}
