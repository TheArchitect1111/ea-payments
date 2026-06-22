'use client';

import GuidedFirstSuccessFlow from '@/app/components/guided-first-success/GuidedFirstSuccessFlow';
import UniversalCoachPanel from '@/app/components/guided-first-success/UniversalCoachPanel';
import ActionCenterPanel from '@/app/components/guided-first-success/ActionCenterPanel';
import { buildPortalActionCenter } from '@/lib/guided-first-success';

export default function PortalHomeExperience({
  slug,
  captureCount,
  opportunityCount,
}: {
  slug: string;
  captureCount: number;
  opportunityCount: number;
}) {
  const actionItems = buildPortalActionCenter({
    slug,
    captureCount,
    opportunityCount,
  });

  return (
    <>
      <GuidedFirstSuccessFlow
        platformId="portal"
        scope={slug}
        firstActionHref="/capture"
      />
      <ActionCenterPanel items={actionItems} />
      <UniversalCoachPanel platformId="portal" />
    </>
  );
}
