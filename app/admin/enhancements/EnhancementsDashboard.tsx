'use client';

import { useState } from 'react';
import type { EnhancementRequestRecord } from '@/lib/airtable';

const STATUSES = ['Submitted', 'Under Review', 'Estimate Sent', 'Approved', 'In Progress', 'Completed', 'Declined'];

export default function EnhancementsDashboard({ initialData }: { initialData: EnhancementRequestRecord[] }) {
  const [requests, setRequests] = useState(initialData);
  const [activeEstimate, setActiveEstimate] = useState<EnhancementRequestRecord | null>(null);
  const [fee, setFee] = useState('');

  async function update(id: string, body: Record<string, unknown>) {
    const res = await fetch(`/api/admin/enhancements/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    if (!res.ok) return;
    setRequests((prev) =>
      prev.map((request) =>
        request.id === id ? { ...request, status: String(body.status ?? request.status) } : request
      )
    );
  }

  async function sendEstimate() {
    if (!activeEstimate || !fee.trim()) return;
    await update(activeEstimate.id, { status: 'Estimate Sent', finalFee: fee });
    setActiveEstimate(null);
    setFee('');
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header className="bg-[#1B2B4D] px-6 py-5 text-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-[#C9A844]">Efficiency Architects</p>
            <h1 className="text-xl font-black uppercase tracking-wide">Enhancement Requests</h1>
          </div>
          <nav className="flex gap-4 text-xs font-bold uppercase tracking-wider text-blue-100">
            <a href="/admin/proposals">Proposals</a>
            <a href="/admin/content-requests">Content</a>
            <a href="/api/admin/logout">Sign Out</a>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="space-y-4">
          {requests.map((request) => (
            <article key={request.id} className="border border-neutral-200 bg-white p-5">
              <div className="flex flex-wrap justify-between gap-3">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-[#C9A844]">{request.organizationName}</p>
                  <h2 className="mt-1 text-lg font-black text-[#1B2B4D]">{request.enhancementType}</h2>
                  <p className="mt-1 text-sm text-neutral-500">{request.aiLevelAssessment ?? 'Needs review'} · {request.aiEstimatedFeeRange ?? 'No range'}</p>
                </div>
                <select value={request.status} onChange={(e) => void update(request.id, { status: e.target.value })} className="h-10 border border-neutral-300 bg-white px-3 text-sm">
                  {STATUSES.map((status) => <option key={status}>{status}</option>)}
                </select>
              </div>
              <div className="mt-4 grid gap-4 lg:grid-cols-2">
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Description</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{request.description}</p>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-neutral-400">Business Goal</p>
                  <p className="mt-2 whitespace-pre-wrap text-sm leading-7 text-neutral-700">{request.businessGoal}</p>
                </div>
              </div>
              {request.notes && (
                <p className="mt-4 border-l-4 border-[#C9A844] bg-neutral-50 p-4 text-sm leading-7 text-neutral-600">{request.notes}</p>
              )}
              <button onClick={() => setActiveEstimate(request)} className="mt-4 bg-[#C9A844] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">Send Estimate</button>
            </article>
          ))}
        </div>
      </main>
      {activeEstimate && (
        <div className="fixed inset-0 flex items-center justify-center bg-[#1B2B4D]/80 p-4">
          <div className="w-full max-w-md bg-white p-6">
            <h2 className="text-xl font-black text-[#1B2B4D]">Send Estimate</h2>
            <p className="mt-2 text-sm text-neutral-600">{activeEstimate.enhancementType}</p>
            <input value={fee} onChange={(e) => setFee(e.target.value)} placeholder="$499" className="mt-5 w-full border border-neutral-300 p-3 text-sm" />
            <div className="mt-5 flex gap-2">
              <button onClick={() => setActiveEstimate(null)} className="border border-neutral-300 px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-600">Cancel</button>
              <button onClick={() => void sendEstimate()} className="bg-[#C9A844] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#1B2B4D]">Send Estimate</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
