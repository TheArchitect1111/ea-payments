'use client';

import { useState } from 'react';
import type { ContentRequestRecord } from '@/lib/airtable';

const STATUSES = ['Pending Review', 'In Progress', 'Awaiting Approval', 'Scheduled', 'Published', 'Completed', 'Needs Additional Information'];

export default function ContentRequestsDashboard({ initialData }: { initialData: ContentRequestRecord[] }) {
  const [requests, setRequests] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState('');

  const displayed = requests.filter((request) => !statusFilter || request.status === statusFilter);

  async function update(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/content-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id
          ? { ...request, status: body.markPublished ? 'Published' : String(body.status ?? request.status), datePublished: body.markPublished ? new Date().toISOString().slice(0, 10) : request.datePublished }
          : request
      )
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-[#1B2B4D] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C9A844]">Efficiency Architects</p>
            <h1 className="text-xl font-black uppercase tracking-wide">Content Requests</h1>
          </div>
          <nav className="flex gap-4 text-xs font-bold uppercase tracking-wider text-blue-100">
            <a href="/admin/proposals">Proposals</a>
            <a href="/admin/enhancements">Enhancements</a>
            <a href="/api/admin/logout">Sign Out</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <select className="mb-6 border border-neutral-300 bg-white px-3 py-2 text-sm" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          {STATUSES.map((status) => <option key={status}>{status}</option>)}
        </select>
        <div className="space-y-4">
          {displayed.map((request) => (
            <article key={request.id} className="border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C9A844]">{request.organizationName}</p>
                  <h2 className="mt-1 text-lg font-black text-[#1B2B4D]">{request.requestType}: {request.title}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{request.submittedBy} · {request.dateSubmitted ?? 'No date'}</p>
                </div>
                <select value={request.status} onChange={(e) => void update(request.id, { status: e.target.value })} className="h-10 border border-neutral-300 bg-white px-3 text-sm">
                  {STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Original Content</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{request.content || request.description || 'No content provided.'}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">AI Enhanced Content</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{request.aiAnalysis || 'No enhanced content available.'}</p>
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <button onClick={() => void update(request.id, { markPublished: true })} className="bg-[#C9A844] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">Mark Published</button>
                <button onClick={() => void update(request.id, { status: 'Needs Additional Information' })} className="border border-neutral-300 px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-600">Request More Info</button>
              </div>
            </article>
          ))}
        </div>
      </main>
    </div>
  );
}
