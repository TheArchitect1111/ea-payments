import 'server-only';

export type PortalCalendarEvent = {
  id: string;
  title: string;
  start: string;
  end?: string;
  allDay: boolean;
  location?: string;
  description?: string;
};

type NylasEvent = {
  id?: string;
  title?: string;
  description?: string;
  location?: string;
  when?: {
    object?: string;
    start_time?: number;
    end_time?: number;
    date?: string;
    start_date?: string;
    end_date?: string;
  };
};

function eventToPortal(event: NylasEvent): PortalCalendarEvent | null {
  const when = event.when;
  if (!event.id || !when) return null;
  const allDay = when.object === 'date' || when.object === 'datespan';
  const start = allDay
    ? when.date || when.start_date
    : when.start_time
      ? new Date(when.start_time * 1000).toISOString()
      : undefined;
  const end = allDay
    ? when.end_date
    : when.end_time
      ? new Date(when.end_time * 1000).toISOString()
      : undefined;
  if (!start) return null;
  return {
    id: event.id,
    title: event.title?.trim() || 'Calendar event',
    start,
    end,
    allDay,
    location: event.location?.trim() || undefined,
    description: event.description?.trim() || undefined,
  };
}

export async function listPortalNylasEvents(input: {
  grantId: string;
  calendarId: string;
  start: Date;
  end: Date;
}): Promise<PortalCalendarEvent[]> {
  const apiKey = process.env.NYLAS_API_KEY?.trim();
  if (!apiKey) throw new Error('NYLAS_API_KEY is not configured.');

  const base = process.env.NYLAS_API_URI?.trim() || 'https://api.us.nylas.com';
  const url = new URL(`/v3/grants/${encodeURIComponent(input.grantId)}/events`, base);
  url.searchParams.set('calendar_id', input.calendarId);
  url.searchParams.set('start', String(Math.floor(input.start.getTime() / 1000)));
  url.searchParams.set('end', String(Math.floor(input.end.getTime() / 1000)));
  url.searchParams.set('limit', '200');

  const response = await fetch(url, {
    headers: { Accept: 'application/json', Authorization: `Bearer ${apiKey}` },
    cache: 'no-store',
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) {
    console.error('[portal-calendar] Nylas list failed', { status: response.status });
    throw new Error('Nylas calendar request failed.');
  }
  const payload = (await response.json()) as { data?: NylasEvent[] };
  return (payload.data ?? [])
    .map(eventToPortal)
    .filter((event): event is PortalCalendarEvent => event !== null);
}
