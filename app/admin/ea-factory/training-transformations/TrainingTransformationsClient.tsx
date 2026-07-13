'use client';

import { useMemo, useState } from 'react';
import type { TrainingTransformationRecord, TrainingTransformationStatus } from '@/lib/training-transformation-store';

type Props = {
  initialRecords: TrainingTransformationRecord[];
};

const TARGETS = ['Training Hub', 'Client Portal', 'Pulse'];

export default function TrainingTransformationsClient({ initialRecords }: Props) {
  const [records, setRecords] = useState(initialRecords);
  const [selectedId, setSelectedId] = useState(initialRecords[0]?.id ?? '');
  const [busy, setBusy] = useState('');
  const selected = useMemo(() => records.find((record) => record.id === selectedId) ?? records[0], [records, selectedId]);

  async function updateRecord(id: string, patch: { status?: TrainingTransformationStatus; tenantId?: string; publishTargets?: string[] }) {
    setBusy(id);
    const response = await fetch(`/api/intelligence/training-transformations/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    });
    const data = await response.json();
    if (data.record) {
      setRecords((current) => current.map((record) => (record.id === id ? data.record : record)));
      setSelectedId(id);
    }
    setBusy('');
  }

  async function publish(id: string) {
    setBusy(id);
    const response = await fetch(`/api/intelligence/training-transformations/${id}/publish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targets: TARGETS }),
    });
    const data = await response.json();
    if (data.record) {
      setRecords((current) => current.map((record) => (record.id === id ? data.record : record)));
      setSelectedId(id);
    }
    setBusy('');
  }

  return (
    <div className="mt-6 grid gap-5 lg:grid-cols-[380px_1fr]">
      <aside className="space-y-3">
        {records.length === 0 ? (
          <div className="border border-dashed border-[#e8d9a8] bg-white p-6 text-sm leading-7 text-neutral-600">
            No generated training transformations are waiting yet. Upload or paste source material through the Training Transformation API to create the first review item.
          </div>
        ) : null}
        {records.map((record) => (
          <button
            key={record.id}
            type="button"
            onClick={() => setSelectedId(record.id)}
            className={`w-full border p-4 text-left transition ${
              selected?.id === record.id
                ? 'border-[#f2c94c] bg-[#fff8e6]'
                : 'border-[#e8d9a8] bg-white hover:border-[#f2c94c]'
            }`}
          >
            <span className="text-[10px] font-black uppercase tracking-[0.22em] text-[#8a6a12]">{record.status}</span>
            <h2 className="mt-2 text-lg font-black text-neutral-900">{record.title}</h2>
            <p className="mt-2 text-xs leading-5 text-neutral-500">
              {record.source.kind} {record.source.extractionStatus ? `/ ${record.source.extractionStatus}` : ''} / {new Date(record.updatedAt).toLocaleString()}
            </p>
          </button>
        ))}
      </aside>

      {selected ? (
        <section className="border border-[#e8d9a8] bg-white p-5 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.24em] text-[#8a6a12]">Review Package</p>
              <h2 className="mt-2 text-3xl font-black text-neutral-900">{selected.title}</h2>
              <p className="mt-2 text-sm text-neutral-500">
                Source: {selected.source.fileName ?? selected.source.kind}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={busy === selected.id}
                onClick={() => updateRecord(selected.id, { status: 'approved' })}
                className="rounded-full border border-[#8a6a12] px-4 py-2 text-xs font-black uppercase tracking-wider text-[#8a6a12] disabled:opacity-50"
              >
                Approve
              </button>
              <button
                type="button"
                disabled={busy === selected.id}
                onClick={() => publish(selected.id)}
                className="rounded-full bg-[#f2c94c] px-4 py-2 text-xs font-black uppercase tracking-wider text-black disabled:opacity-50"
              >
                Publish
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-3 md:grid-cols-3">
            {TARGETS.map((target) => (
              <div key={target} className="border border-[#e8d9a8] bg-[#FAF8F3] p-4">
                <p className="text-xs font-black uppercase tracking-wider text-[#8a6a12]">{target}</p>
                <p className="mt-2 text-xs leading-5 text-neutral-500">
                  {selected.publishedTargets.includes(target) ? 'Published' : selected.publishTargets.includes(target) ? 'Ready' : 'Optional'}
                </p>
              </div>
            ))}
          </div>

          <article className="mt-5 border border-[#e8d9a8] bg-[#FAF8F3] p-5">
            <h3 className="text-lg font-black text-neutral-900">What EA Intelligence understood</h3>
            <p className="mt-3 text-sm leading-7 text-neutral-600">{selected.understanding.summary}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {selected.understanding.opportunities.slice(0, 6).map((item) => (
                <span key={item} className="rounded-full border border-[#e8d9a8] bg-white px-3 py-1 text-xs text-neutral-600">
                  {item}
                </span>
              ))}
            </div>
          </article>

          <div className="mt-5 grid gap-4">
            {selected.outputs.map((output) => (
              <article key={`${selected.id}-${output.type}`} className="border border-[#e8d9a8] bg-[#FAF8F3] p-5">
                <p className="text-xs font-black uppercase tracking-[0.2em] text-[#8a6a12]">{output.type}</p>
                <h3 className="mt-2 text-xl font-black text-neutral-900">{output.title}</h3>
                <pre className="mt-4 whitespace-pre-wrap text-sm leading-7 text-neutral-600">{output.body}</pre>
                <p className="mt-4 text-xs font-bold text-neutral-500">Targets: {output.publishTargets.join(', ')}</p>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
