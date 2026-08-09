'use client';

import { useMemo, useState } from 'react';
import type { ContentRequestRecord } from '@/lib/airtable';
import { isSocialPostRequest } from '@/lib/amplifi-publish';
import { parseAmplifiResearchNotes } from '@/lib/amplifi/topic-research';

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

type AmplifiResult = { ok: boolean; mode: string; detail: string };

export default function ContentRequestsDashboard({ initialData }: { initialData: ContentRequestRecord[] }) {
  const [requests, setRequests] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState('queue');
  const [selectedId, setSelectedId] = useState(
    initialData.find((item) => QUEUE_STATUSES.has(item.status))?.id ?? initialData[0]?.id ?? '',
  );
  const [publishDrafts, setPublishDrafts] = useState<Record<string, string>>({});
  const [publishNotes, setPublishNotes] = useState<Record<string, string>>({});

  const queueCount = useMemo(
    () => requests.filter((item) => QUEUE_STATUSES.has(item.status)).length,
    [requests],
  );
  const displayed = requests.filter((request) => {
    if (statusFilter === 'queue') return QUEUE_STATUSES.has(request.status);
    if (!statusFilter) return true;
    return request.status === statusFilter;
  });
  const selected = displayed.find((item) => item.id === selectedId) ?? displayed[0];
  const selectedResearch = selected ? parseAmplifiResearchNotes(selected.additionalNotes) : null;
  const selectedSocial = selected
    ? isSocialPostRequest(selected.requestType) || Boolean(selectedResearch)
    : false;

  function draftFor(request: ContentRequestRecord) {
    return publishDrafts[request.id] ?? request.aiAnalysis ?? request.content ?? request.description ?? '';
  }

  async function update(id: string, body: Record<string, unknown>) {
    const response = await fetch(`/api/admin/content-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!response.ok) return;
    const data = (await response.json()) as { status?: string; datePublished?: string; amplifi?: AmplifiResult };
    setRequests((current) =>
      current.map((request) => {
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
          publishedContent: body.publishedBody ? String(body.publishedBody) : request.publishedContent,
        };
      }),
    );
    if (data.amplifi) {
      setPublishNotes((current) => ({
        ...current,
        [id]: `${data.amplifi!.mode === 'webhook' ? 'Social queued' : 'Manual share'}: ${data.amplifi!.detail}`,
      }));
    }
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-[#1B2B4D] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C9A844]">
              Guided editor · Amplifi™
            </p>
            <h1 className="text-2xl font-black uppercase tracking-wide">Update Hub™</h1>
            <p className="mt-1 text-sm text-blue-100">
              Choose an item, edit the message, review it, then publish. Amplifi Search drafts include topic, date
              window, and sources.
            </p>
          </div>
          <nav className="flex gap-4 text-xs font-bold uppercase tracking-wider text-blue-100">
            <a href="/admin/master">Command Center</a>
            <a href="/amplifi">Amplifi</a>
            <a href="/api/admin/logout">Sign Out</a>
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-6 grid gap-3 md:grid-cols-4">
          {['1. Choose item', '2. Edit content', '3. Review', '4. Publish'].map((step, index) => (
            <div
              key={step}
              className={`border p-4 text-sm font-black uppercase tracking-wide ${
                index === 0
                  ? 'border-[#C9A844] bg-[#FFF9E8] text-[#1B2B4D]'
                  : 'border-neutral-200 bg-white text-neutral-500'
              }`}
            >
              {step}
            </div>
          ))}
        </div>

        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-semibold text-neutral-600">{queueCount} item(s) need action</p>
          <select
            className="border border-neutral-300 bg-white px-3 py-2 text-sm"
            value={statusFilter}
            onChange={(event) => setStatusFilter(event.target.value)}
          >
            <option value="queue">Publish queue</option>
            <option value="">All statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-5 lg:grid-cols-[320px_minmax(0,1fr)]">
          <aside className="border border-neutral-200 bg-white p-3">
            <p className="px-2 pb-3 text-xs font-black uppercase tracking-[0.18em] text-neutral-400">Choose item</p>
            <div className="space-y-2">
              {displayed.map((request) => {
                const research = parseAmplifiResearchNotes(request.additionalNotes);
                return (
                  <button
                    type="button"
                    key={request.id}
                    onClick={() => setSelectedId(request.id)}
                    className={`w-full border p-3 text-left ${
                      selected?.id === request.id
                        ? 'border-[#1B2B4D] bg-[#F2F5FA]'
                        : 'border-neutral-200 bg-white'
                    }`}
                  >
                    <span className="block text-xs font-bold uppercase tracking-wider text-[#C9A844]">
                      {request.organizationName}
                      {research ? ' · Search' : ''}
                    </span>
                    <span className="mt-1 block font-black text-[#1B2B4D]">{request.title}</span>
                    <span className="mt-1 block text-xs text-neutral-500">{request.status}</span>
                  </button>
                );
              })}
              {!displayed.length ? (
                <p className="p-5 text-center text-sm text-neutral-500">No items match this filter.</p>
              ) : null}
            </div>
          </aside>

          {selected ? (
            <section className="border border-neutral-200 bg-white p-6">
              <div className="flex flex-wrap justify-between gap-4 border-b border-neutral-200 pb-5">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C9A844]">
                    {selected.organizationName}
                    {selectedSocial ? ' · Amplifi social' : ''}
                    {selectedResearch ? ' · Topic research' : ''}
                  </p>
                  <h2 className="mt-1 text-2xl font-black text-[#1B2B4D]">
                    {selected.requestType}: {selected.title}
                  </h2>
                  <p className="mt-1 text-sm text-neutral-500">
                    {selected.submittedBy} · {selected.dateSubmitted ?? 'No date'} · Priority: {selected.priority}
                  </p>
                  {selectedResearch ? (
                    <p className="mt-2 text-sm text-[#1B2B4D]">
                      Amplifi Search: <strong>{selectedResearch.topic}</strong> · {selectedResearch.dateFrom} →{' '}
                      {selectedResearch.dateTo}
                    </p>
                  ) : null}
                  {selected.videoLink ? (
                    <p className="mt-2 text-xs text-neutral-500">
                      Story:{' '}
                      <a
                        href={selected.videoLink}
                        className="underline text-[#1B2B4D]"
                        target="_blank"
                        rel="noreferrer"
                      >
                        {selected.videoLink}
                      </a>
                    </p>
                  ) : null}
                </div>
                <select
                  value={selected.status}
                  onChange={(event) => void update(selected.id, { status: event.target.value })}
                  className="h-10 border border-neutral-300 bg-white px-3 text-sm"
                >
                  {STATUSES.map((status) => (
                    <option key={status}>{status}</option>
                  ))}
                </select>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-2">
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-neutral-400">Original submission</p>
                  <div className="mt-2 min-h-[180px] whitespace-pre-wrap border border-neutral-200 bg-neutral-50 p-4 text-sm leading-7 text-neutral-700">
                    {selected.content || selected.description || 'No content provided.'}
                  </div>
                  {selectedResearch?.sources?.length ? (
                    <div className="mt-4">
                      <p className="text-xs font-black uppercase tracking-wider text-neutral-400">Research sources</p>
                      <ul className="mt-2 space-y-2 text-sm text-neutral-700">
                        {selectedResearch.sources.map((source) => (
                          <li key={source.url}>
                            <a
                              href={source.url}
                              className="font-semibold text-[#1B2B4D] underline"
                              target="_blank"
                              rel="noreferrer"
                            >
                              {source.title || source.url}
                            </a>
                            <span className="text-neutral-500">
                              {' '}
                              · {source.kind}
                              {source.publishedAt ? ` · ${source.publishedAt}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : null}
                </div>
                <div>
                  <p className="text-xs font-black uppercase tracking-wider text-neutral-400">Edit content</p>
                  <textarea
                    className="mt-2 min-h-[180px] w-full border border-neutral-300 p-4 text-sm leading-7 text-neutral-700"
                    value={draftFor(selected)}
                    onChange={(event) =>
                      setPublishDrafts((current) => ({ ...current, [selected.id]: event.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="mt-6 border border-dashed border-neutral-300 bg-[#FAFAF8] p-5">
                <p className="text-xs font-black uppercase tracking-wider text-neutral-400">Review before publishing</p>
                <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">
                  {draftFor(selected) || 'Nothing has been prepared for publishing yet.'}
                </p>
              </div>

              {publishNotes[selected.id] ? (
                <p className="mt-4 text-sm font-semibold text-green-800">{publishNotes[selected.id]}</p>
              ) : null}

              <div className="mt-6 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    void update(selected.id, { markPublished: true, publishedBody: draftFor(selected) })
                  }
                  className="bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1B2B4D]"
                >
                  {selectedSocial ? 'Approve & publish social' : 'Publish now'}
                </button>
                <button
                  type="button"
                  onClick={() =>
                    void update(selected.id, { markScheduled: true, publishedBody: draftFor(selected) })
                  }
                  className="border border-[#1B2B4D] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1B2B4D]"
                >
                  Schedule
                </button>
                <button
                  type="button"
                  onClick={() => void update(selected.id, { status: 'Needs Additional Information' })}
                  className="border border-neutral-300 px-5 py-3 text-xs font-black uppercase tracking-wider text-neutral-600"
                >
                  Request more info
                </button>
              </div>
            </section>
          ) : null}
        </div>
      </main>
    </div>
  );
}
