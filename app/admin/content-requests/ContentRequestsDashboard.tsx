'use client';

import { useMemo, useState } from 'react';
import type { ContentRequestRecord } from '@/lib/airtable';

const STATUSES = [
  'Pending Review',
  'In Progress',
  'Awaiting Approval',
  'Scheduled',
  'Published',
  'Completed',
  'Needs Additional Information',
];

const QUEUE_STATUSES = new Set(['Pending Review', 'In Progress', 'Awaiting Approval', 'Scheduled']);

export default function ContentRequestsDashboard({ initialData }: { initialData: ContentRequestRecord[] }) {
  const [requests, setRequests] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState('queue');
  const [publishDrafts, setPublishDrafts] = useState<Record<string, string>>({});

  const queueCount = useMemo(
    () => requests.filter((r) => QUEUE_STATUSES.has(r.status)).length,
    [requests],
  );

  const displayed = requests.filter((request) => {
    if (statusFilter === 'queue') return QUEUE_STATUSES.has(request.status);
    if (!statusFilter) return true;
    return request.status === statusFilter;
  });

  function draftFor(request: ContentRequestRecord) {
    return publishDrafts[request.id] ?? request.aiAnalysis ?? request.content ?? request.description ?? '';
  }

  async function update(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/content-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    const data = (await res.json()) as { ok?: boolean; status?: string; datePublished?: string };
    setRequests((prev) =>
      prev.map((request) => {
        if (request.id !== id) return request;
        const status = body.markPublished
          ? 'Published'
          : body.markScheduled
            ? 'Scheduled'
            : String(body.status ?? request.status);
        return {
          ...request,
          status,
          datePublished: body.markPublished
            ? data.datePublished ?? new Date().toISOString().slice(0, 10)
            : request.datePublished,
          publishedContent: body.publishedBody
            ? String(body.publishedBody)
            : request.publishedContent,
        };
      }),
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-[#1B2B4D] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C9A844]">Update Hub™</p>
            <h1 className="text-xl font-black uppercase tracking-wide">Publish Queue</h1>
            <p className="mt-1 text-sm text-blue-100">{queueCount} item(s) need action</p>
          </div>
          <nav className="flex gap-4 text-xs font-bold uppercase tracking-wider text-blue-100">
            <a href="/admin/master">Command Center</a>
            <a href="/admin/proposals">Proposals</a>
            <a href="/admin/enhancements">Enhancements</a>
            <a href="/api/admin/logout">Sign Out</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <select
          className="mb-6 border border-neutral-300 bg-white px-3 py-2 text-sm"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="queue">Publish queue (needs action)</option>
          <option value="">All statuses</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {status}
            </option>
          ))}
        </select>
        <div className="space-y-4">
          {displayed.length === 0 && (
            <p className="border border-neutral-200 bg-white p-8 text-center text-sm text-neutral-500">
              Queue is clear — no items match this filter.
            </p>
          )}
          {displayed.map((request) => (
            <article key={request.id} className="border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C9A844]">
                    {request.organizationName}
                  </p>
                  <h2 className="mt-1 text-lg font-black text-[#1B2B4D]">
                    {request.requestType}: {request.title}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {request.submittedBy} · {request.dateSubmitted ?? 'No date'} · Priority: {request.priority}
                  </p>
                </div>
                <select
                  value={request.status}
                  onChange={(e) => void update(request.id, { status: e.target.value })}
                  className="h-10 border border-neutral-300 bg-white px-3 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Original submission</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
                    {request.content || request.description || 'No content provided.'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">
                    Publish body (client feed)
                  </p>
                  <textarea
                    className="mt-2 min-h-[140px] w-full border border-neutral-300 p-3 text-sm leading-7 text-neutral-700"
                    value={draftFor(request)}
                    onChange={(e) =>
                      setPublishDrafts((prev) => ({ ...prev, [request.id]: e.target.value }))
                    }
                  />
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void update(request.id, {
                      markPublished: true,
                      publishedBody: draftFor(request),
                    })
                  }
                  className="bg-[#C9A844] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D]"
                >
                  Publish now
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void update(request.id, {
                      markScheduled: true,
                      publishedBody: draftFor(request),
                    })
                  }
                  className="border border-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D]"
                >
                  Mark scheduled
                </button>
                <button
                  type="button"
                  onClick={() => void update(request.id, { status: 'In Progress' })}
                  className="border border-neutral-300 px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-600"
                >
                  Start review
                </button>
                <button
                  type="button"
                  onClick={() => void update(request.id, { status: 'Needs Additional Information' })}
                  className="border border-neutral-300 px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-600"
                >
                  Request more info
                </button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
