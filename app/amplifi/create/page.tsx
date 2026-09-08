import type { Metadata } from 'next';
import AmplifiCreateStudio from './AmplifiCreateStudio';

export const metadata: Metadata = {
  title: 'Create with Amplifi',
  description: 'Create a post, series or campaign with Amplifi.',
};

export default async function AmplifiCreatePage({ searchParams }: { searchParams: Promise<{ mode?: string }> }) {
  const { mode } = await searchParams;
  const initialMode = mode === 'post' || mode === 'series' || mode === 'campaign' ? mode : 'campaign';
  return <AmplifiCreateStudio initialMode={initialMode} />;
}
