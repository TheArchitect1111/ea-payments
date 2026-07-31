'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventInput } from '@fullcalendar/core';
import { useCallback, useState } from 'react';

export default function PortalCalendar({ slug }: { slug: string }) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [status, setStatus] = useState('Loading calendar…');

  const datesSet = useCallback(async (range: DatesSetArg) => {
    setStatus('Loading calendar…');
    const query = new URLSearchParams({
      slug,
      start: range.start.toISOString(),
      end: range.end.toISOString(),
    });
    try {
      const response = await fetch(`/api/portal/calendar?${query}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const payload = (await response.json()) as {
        configured?: boolean;
        events?: EventInput[];
        message?: string;
        error?: string;
      };
      if (!response.ok) {
        setEvents([]);
        setStatus(payload.error || 'Calendar could not be loaded.');
        return;
      }
      setEvents(payload.events ?? []);
      setStatus(payload.configured === false ? payload.message || 'Calendar not connected.' : '');
    } catch {
      setEvents([]);
      setStatus('Calendar could not be loaded.');
    }
  }, [slug]);

  return (
    <div className="ep-module-card ep-shared-calendar">
      {status ? <p className="ep-module-card-note" role="status">{status}</p> : null}
      <FullCalendar
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
        initialView="dayGridMonth"
        headerToolbar={{ left: 'prev,next today', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay' }}
        buttonText={{ today: 'Today', month: 'Month', week: 'Week', day: 'Day' }}
        events={events}
        datesSet={datesSet}
        nowIndicator
        dayMaxEvents={3}
        height="auto"
      />
    </div>
  );
}
