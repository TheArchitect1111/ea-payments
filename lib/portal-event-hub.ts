/**
 * Tenant event hub — pretix registrations + CTP schedule + Calendly (+ optional Connect).
 * Registration/payments/confirmations live in pretix; EA lists + deep-links + Pulse on webhook.
 */
import type { PortalClientRecord } from '@/lib/airtable';
import { ctpCalendlyUrl } from '@/lib/ctp-calendly';
import { buildCtpScheduleView } from '@/lib/ctp-schedule-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import { listConnectOrgs } from '@/lib/connect-store';
import { listPretixEventsForPortal } from '@/lib/events/pretix-store';

export type PortalEventItem = {
  id?: string;
  title: string;
  when: string;
  detail: string;
  href: string;
  source: 'pretix' | 'ctp' | 'calendly' | 'connect' | 'hub';
  external?: boolean;
  ctaLabel?: string;
  location?: string;
};

function formatEventWhen(startsAt?: string, endsAt?: string): string {
  if (!startsAt) return 'Open registration';
  try {
    const start = new Date(startsAt);
    if (Number.isNaN(start.getTime())) return startsAt;
    const startLabel = start.toLocaleString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
    if (!endsAt) return startLabel;
    const end = new Date(endsAt);
    if (Number.isNaN(end.getTime())) return startLabel;
    return `${startLabel} – ${end.toLocaleString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })}`;
  } catch {
    return startsAt;
  }
}

export async function listPortalEvents(
  slug: string,
  client: PortalClientRecord,
): Promise<PortalEventItem[]> {
  const items: PortalEventItem[] = [];
  let calendlyUrl = ctpCalendlyUrl();

  try {
    const pretixEvents = await listPretixEventsForPortal(slug);
    for (const event of pretixEvents) {
      const bits = [event.summary];
      if (event.location) bits.push(event.location);
      items.push({
        id: event.id,
        title: event.title,
        when: formatEventWhen(event.startsAt, event.endsAt),
        detail: bits.filter(Boolean).join(' · '),
        href: event.shopUrl,
        source: 'pretix',
        external: true,
        ctaLabel: 'Register',
        location: event.location,
      });
    }
  } catch {
    // pretix store is best-effort (env seed or local JSON).
  }

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
          ctaLabel: 'Open review',
        });
      } else {
        items.push({
          title: schedule.headline,
          when: schedule.completed ? 'Follow-up anytime' : 'Not scheduled yet',
          detail: schedule.summary,
          href: `/portal/${slug}/ctp/schedule`,
          source: 'ctp',
          ctaLabel: 'Schedule',
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
    ctaLabel: 'Book',
  });

  try {
    const connectOrgs = await listConnectOrgs();
    const connectOrg = connectOrgs.find((org) => org.slug === slug.trim().toLowerCase());
    const named = (connectOrg?.journey.events || []).filter((e) => e.trim()).slice(0, 4);
    if (connectOrg && named.length > 0) {
      for (const name of named) {
        items.push({
          title: name,
          when: connectOrg.journey.eventsTitle || 'Upcoming',
          detail: connectOrg.journey.eventNote || 'From your Connect journey template.',
          href: `/portal/${slug}/connect`,
          source: 'connect',
          ctaLabel: 'View',
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
    ctaLabel: 'Open',
  });

  return items;
}
