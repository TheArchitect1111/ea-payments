import type { Metadata } from 'next';
import AmplifiCreateStudio from './AmplifiCreateStudio';
import { AMPLIFI_CUSTOMER_ZERO } from '@/lib/amplifi-customer-zero';

export const metadata: Metadata = {
  title: 'Create with Amplifi',
  description: 'Create a post, series or campaign with Amplifi.',
};

export default async function AmplifiCreatePage({ searchParams }: { searchParams: Promise<{ mode?: string; customerZero?: string }> }) {
  const { mode, customerZero } = await searchParams;
  const initialMode = mode === 'post' || mode === 'series' || mode === 'campaign' ? mode : 'campaign';
  const brief = customerZero ? AMPLIFI_CUSTOMER_ZERO.briefs.find(item => item.id === customerZero) : undefined;
  const initialBrief = brief ? {
    brandName: brief.business,
    topic: brief.creativeHook,
    goal: brief.goal,
    audience: brief.audience,
    offer: `${brief.offer}. ${brief.proof}`,
    cta: brief.cta,
    details: `Customer Zero · ${AMPLIFI_CUSTOMER_ZERO.campaignName}`,
  } : undefined;
  return <AmplifiCreateStudio initialMode={initialMode} initialBrief={initialBrief} />;
}
