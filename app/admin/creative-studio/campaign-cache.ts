import type { CreativeCampaign } from '@/lib/creative-studio/types';

const cacheKey = (id: string) => `creative-studio:campaign:${id}`;

export function cacheCampaign(campaign: CreativeCampaign): void {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.setItem(cacheKey(campaign.id), JSON.stringify(campaign));
  } catch {
    /* ignore quota */
  }
}

export function readCachedCampaign(id: string): CreativeCampaign | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(cacheKey(id));
    return cached ? (JSON.parse(cached) as CreativeCampaign) : null;
  } catch {
    return null;
  }
}
