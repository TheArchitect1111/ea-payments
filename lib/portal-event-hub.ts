/**
 * Tenant event hub — CTP review schedule + Calendly (+ optional Connect template events).
 */
import type { PortalClientRecord } from '@/lib/airtable';
import { ctpCalendlyUrl } from '@/lib/ctp-calendly';
import { buildCtpScheduleView } from '@/lib/ctp-schedule-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { listConnectOrgs } from '@/lib/connect-store';

export type PortalEventItem = {
  title: string;
  when: string;
  detail: string;
  href: string;
  source: 'ctp' | 'calendly' | 'connect' | 'hub';
  external?: boolean;
};

export async function listPortalEvents(
  slug: string,
  client: PortalClientRecord,
): Promise<PortalEventItem[]> {
  const items: PortalEventItem[] = [];
  let calendlyUrl = ctpCalendlyUrl();

  try {
    const submission = await getCtpSubmissionForPortal({
      portalSlug: slug,
      email: client.email,
    });
    if (submission) {
      const schedule = buildCtpScheduleView(submission);
      calendlyUrl = schedule.calendlyUrl || calendlyUrl;

      if (schedule.reviewScheduledAt && schedule.reviewLabel) {
        items.push({
          title: 'Opportunity Review',
          when: schedule.reviewLabel,
          detail: schedule.summary,
          href: `/portal/${slug}/ctp/review`,
          source: 'ctp',
        });
      } else {
        items.push({
          title: schedule.headline,
          when: schedule.completed ? 'Follow-up anytime' : 'Not scheduled yet',
          detail: schedule.summary,
          href: `/portal/${slug}/ctp/schedule`,
          source: 'ctp',
        });
      }
    }
  } catch {
    // CTP schedule is best-effort.
  }

  items.push({
    title: 'Book a strategy session',
    when: 'Open calendar',
    detail: `Advisor time for ${client.organization || client.clientName}.`,
    href: calendlyUrl,
    source: 'calendly',
    external: true,
  });

  try {
    const connectOrgs = await listConnectOrgs();
    const connectOrg = connectOrgs.find((org) => org.slug === slug.trim().toLowerCase());
    const named = (connectOrg?.events || []).filter((e) => e.trim()).slice(0, 4);
    if (connectOrg && named.length > 0) {
      for (const name of named) {
        items.push({
          title: name,
          when: connectOrg.eventsTitle || 'Upcoming',
          detail: connectOrg.eventNote || 'From your Connect journey template.',
          href: `/portal/${slug}/connect`,
          source: 'connect',
        });
      }
    }
  } catch {
    // Connect org templates are optional.
  }

  items.push({
    title: 'CTP workspace',
    when: 'Always available',
    detail: 'Progress, documents, and review status for your Consider journey.',
    href: `/portal/${slug}/ctp`,
    source: 'hub',
  });

  return items;
}
