import { notFound } from 'next/navigation';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { buildMagnifiExperience } from '@/lib/magnifi-experience-engine';
import MagnifiExperienceV2 from './MagnifiExperienceV2';
import MagnifiClassicReport from './MagnifiClassicReport';

export const dynamic = 'force-dynamic';

export default async function MagnifiOpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ classic?: string }>;
}) {
  const { id } = await params;
  const { classic } = await searchParams;
  const capture = await getCaptureByIdentifier(id);

  if (!capture) {
    notFound();
  }

  if (classic === '1') {
    return <MagnifiClassicReport capture={capture} />;
  }

  const experience = buildMagnifiExperience(capture);
  return <MagnifiExperienceV2 experience={experience} />;
}
