import { notFound } from 'next/navigation';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { buildGuidanceExperience } from '@/lib/simplifi-guidance-engine';
import SimplifiGuidanceV2 from './SimplifiGuidanceV2';

export const dynamic = 'force-dynamic';

export default async function SimplifiGuidancePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const capture = await getCaptureByIdentifier(id);
  if (!capture) notFound();

  const experience = buildGuidanceExperience(capture);

  return <SimplifiGuidanceV2 experience={experience} />;
}
