import type { PortalClientRecord } from '@/lib/airtable';
import type { PortalModuleAccess } from '@/lib/modules/portal-modules';

export type PortalReportArtifact = {
  title: string;
  href: string;
  detail: string;
};

/**
 * Curated reports gallery — Pulse, CTP BI, and Documents surfaces the tenant can reach today.
 */
export function listReportArtifacts(
  slug: string,
  _client: PortalClientRecord,
  access: PortalModuleAccess,
): PortalReportArtifact[] {
  const base = `/portal/${slug}`;
  const artifacts: PortalReportArtifact[] = [];

  if (access.enabledModuleIds.has('pulse')) {
    artifacts.push({
      title: 'Pulse™ health view',
      href: `${base}/pulse`,
      detail: 'Organization signals, bottlenecks, and what needs attention.',
    });
  }

  if (access.enabledModuleIds.has('ctp')) {
    artifacts.push({
      title: 'CTP progress & BI',
      href: `${base}/ctp`,
      detail: 'Project journey, studio progress, and transformation milestones.',
    });
    artifacts.push({
      title: 'Design studio',
      href: `${base}/ctp/progress`,
      detail: 'Live build status and review-ready deliverables.',
    });
  }

  if (access.enabledModuleIds.has('documents')) {
    artifacts.push({
      title: 'Document vault',
      href: `${base}/documents`,
      detail: 'Agreements, scorecards, and shared operational files.',
    });
  }

  if (access.enabledModuleIds.has('update-hub')) {
    artifacts.push({
      title: 'Activity timeline',
      href: `${base}/updates`,
      detail: 'Advisor updates, captures, and published activity.',
    });
  }

  if (access.enabledModuleIds.has('events')) {
    artifacts.push({
      title: 'Event Hub registrations',
      href: `${base}/events?tab=registrations`,
      detail: 'Ticketed events and registration history.',
    });
  }

  return artifacts;
}
