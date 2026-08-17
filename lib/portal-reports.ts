import type { PortalClientRecord } from '@/lib/airtable';
import type { PortalModuleAccess } from '@/lib/modules/portal-modules-shared';

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
  const isAmanda = slug.toLowerCase().startsWith('amanda-catherine');
  const artifacts: PortalReportArtifact[] = [];

  if (access.enabledModuleIds.has('pulse')) {
    artifacts.push({
      title: isAmanda ? 'Portal and business status' : 'Pulse™ health view',
      href: `${base}/pulse`,
      detail: isAmanda ? 'See current activity, items needing attention, and operational signals.' : 'Organization signals, bottlenecks, and what needs attention.',
    });
  }

  if (access.enabledModuleIds.has('ctp')) {
    artifacts.push({
      title: isAmanda ? 'Website and portal project progress' : 'CTP progress & BI',
      href: `${base}/ctp`,
      detail: isAmanda ? 'See completed work, current work, approvals, and upcoming milestones.' : 'Project journey, studio progress, and transformation milestones.',
    });
    artifacts.push({
      title: isAmanda ? 'Website and design requests' : 'Design studio',
      href: `${base}/ctp/progress`,
      detail: isAmanda ? 'Review website or portal work and send feedback on items ready for approval.' : 'Live build status and review-ready deliverables.',
    });
  }

  if (access.enabledModuleIds.has('documents')) {
    artifacts.push({
      title: isAmanda ? 'Files and documents' : 'Document vault',
      href: `${base}/documents`,
      detail: isAmanda ? 'Open agreements, course materials, shared files, and completed deliverables.' : 'Agreements, scorecards, and shared operational files.',
    });
  }

  if (access.enabledModuleIds.has('update-hub')) {
    artifacts.push({
      title: isAmanda ? 'Recent support activity' : 'Activity timeline',
      href: `${base}/updates`,
      detail: isAmanda ? 'Follow technical-support requests, replies, and completed portal updates.' : 'Advisor updates, captures, and published activity.',
    });
  }

  if (access.enabledModuleIds.has('events')) {
    artifacts.push({
      title: isAmanda ? 'Event registrations' : 'Event Hub registrations',
      href: `${base}/events?tab=registrations`,
      detail: isAmanda ? 'See upcoming events, registered participants, and registration history.' : 'Ticketed events and registration history.',
    });
  }

  return artifacts;
}
