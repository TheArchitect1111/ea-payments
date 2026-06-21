import { notFound } from 'next/navigation';
import { resolveConsiderExperience } from '@/lib/consider-resolve';
import ConsiderExperience from './ConsiderExperience';

export const dynamic = 'force-dynamic';

export default async function ConsiderPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const resolved = await resolveConsiderExperience(slug);

  if (!resolved) {
    notFound();
  }

  return (
    <ConsiderExperience
      payload={resolved.payload}
      captureId={resolved.captureId}
      slug={slug}
      isDemo={resolved.source === 'demo-static'}
    />
  );
}
