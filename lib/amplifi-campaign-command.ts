import type { CampaignArchitecture } from '@/lib/creative-studio/types';

export type PortfolioCampaignPost = {
  title: string;
  caption: string;
  callToAction: string;
  imageDirection: string;
  productId?: string;
  audienceId?: string;
  waveId?: string;
};

export function assignPortfolioPosts<T extends PortfolioCampaignPost>(posts: T[], architecture: CampaignArchitecture): T[] {
  if (architecture.mode !== 'portfolio' || !architecture.products.length) return posts;
  return posts.map((post, index) => {
    const product = architecture.products.find((item) => item.id === post.productId) || architecture.products[index % architecture.products.length];
    const audienceId = product.audienceIds[0] || architecture.audiences[0]?.id;
    const wave = architecture.waves.find((item) => item.productIds.includes(product.id) && (!audienceId || item.audienceIds.includes(audienceId))) || architecture.waves.find((item) => item.productIds.includes(product.id));
    const productCta = `${product.callToAction.label}${product.callToAction.url ? ` ${product.callToAction.url}` : ''}`.trim();
    return { ...post, callToAction: productCta || post.callToAction, productId: product.id, audienceId, waveId: wave?.id };
  });
}

export function findPortfolioScheduleConflicts(posts: PortfolioCampaignPost[], schedule: Record<number, string>, architecture: CampaignArchitecture): string[] {
  if (architecture.mode !== 'portfolio') return [];
  const conflicts = new Set<string>();
  const scheduled = posts.map((post, index) => ({ post, index, at: schedule[index] ? new Date(schedule[index]).getTime() : NaN })).filter((item) => Number.isFinite(item.at));
  for (let left = 0; left < scheduled.length; left += 1) {
    for (let right = left + 1; right < scheduled.length; right += 1) {
      const a = scheduled[left];
      const b = scheduled[right];
      if (!a.post.audienceId || a.post.audienceId !== b.post.audienceId || Math.abs(a.at - b.at) >= 86400000) continue;
      const audience = architecture.audiences.find((item) => item.id === a.post.audienceId)?.name || 'the same audience';
      conflicts.add(`Posts ${a.index + 1} and ${b.index + 1} target ${audience} less than 24 hours apart.`);
    }
  }
  for (const item of scheduled) {
    const wave = architecture.waves.find((candidate) => candidate.id === item.post.waveId);
    if (wave?.startDate && item.at < new Date(`${wave.startDate}T00:00:00`).getTime()) conflicts.add(`Post ${item.index + 1} is scheduled before ${wave.name} begins.`);
    if (wave?.endDate && item.at > new Date(`${wave.endDate}T23:59:59`).getTime()) conflicts.add(`Post ${item.index + 1} is scheduled after ${wave.name} ends.`);
  }
  return [...conflicts];
}
