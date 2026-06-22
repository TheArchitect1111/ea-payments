'use client';

import GuidedFirstSuccessFlow from '@/app/components/guided-first-success/GuidedFirstSuccessFlow';
import UniversalCoachPanel from '@/app/components/guided-first-success/UniversalCoachPanel';
import EmptyStateGuide from '@/app/components/guided-first-success/EmptyStateGuide';

export default function UpdateHubExperience({
  slug,
  requestCount,
}: {
  slug: string;
  requestCount: number;
}) {
  return (
    <>
      <GuidedFirstSuccessFlow
        platformId="update-hub"
        scope={slug}
        firstActionHref={`/portal/${slug}/updates/new`}
      />
      <UniversalCoachPanel platformId="update-hub" />
      {requestCount === 0 && (
        <EmptyStateGuide
          title="No updates yet"
          explanation="Publish your first communication — your team tracks status from submission to publish."
          actionLabel="Create first update"
          actionHref={`/portal/${slug}/updates/new`}
        />
      )}
    </>
  );
}
