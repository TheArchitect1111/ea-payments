'use client';

import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import type { DatesSetArg, EventInput } from '@fullcalendar/core';
import { useCallback, useState } from 'react';

export default function PortalCalendar({ slug, canWrite = false }: { slug: string; canWrite?: boolean }) {
  const [events, setEvents] = useState<EventInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [eventId, setEventId] = useState('');
  const [internal, setInternal] = useState(false);
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
        provider?: string;
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
      setInternal(payload.provider === 'internal');
      setStatus(payload.configured === false ? payload.message || 'Calendar not connected.' : '');
    } catch {
      setEvents([]);
      setStatus('Calendar could not be loaded.');
    }
  }, [slug]);

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); const form = event.currentTarget; const data = new FormData(form);
    const id = eventId || crypto.randomUUID(); setEventId(id); setSaving(true);
    try {
      const response = await fetch(`/api/portal/${encodeURIComponent(slug)}/calendar/events`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
        id, title: data.get('title'), start: new Date(String(data.get('start'))).toISOString(), end: new Date(String(data.get('end'))).toISOString(), allDay: false,
      }) });
      const row = await response.json(); if (!response.ok) throw new Error(row.error || 'Event could not be saved.');
      setEvents(previous => [...previous.filter(x => x.id !== id), row.event]); setStatus('Event saved.'); form.reset(); setEventId('');
    } catch (error) { setStatus(error instanceof Error ? error.message : 'Please try again.'); }
    finally { setSaving(false); }
  }

  return (
    <div className="ep-module-card ep-shared-calendar">
      {status ? <p className="ep-module-card-note" role="status">{status}</p> : null}
      {canWrite && internal ? <form className="ep-brick-form" onSubmit={save} style={{ display: 'grid', gap: 12, maxWidth: 600, marginBottom: 24 }}>
        <label>Event title<input className="ep-input" name="title" required maxLength={200} /></label>
        <label>Starts<input className="ep-input" name="start" type="datetime-local" required /></label>
        <label>Ends<input className="ep-input" name="end" type="datetime-local" required /></label>
        <button className="ep-btn" disabled={saving}>{saving ? 'Saving…' : 'Add event'}</button>
      </form> : null}
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
