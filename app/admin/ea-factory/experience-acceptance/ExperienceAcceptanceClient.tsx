'use client';

import { useState } from 'react';
import Link from 'next/link';
import { NAVY, GOLD } from '@/lib/design-system';

type Row = {
  label: string;
  projectId: string;
  found: boolean;
  client: string;
  knowledgeSummary: {
    name: string;
    claims: number;
    biography: string;
    organizations: string[];
    validation: { ok: boolean; reasons: string[] };
  } | null;
  mediaSummary: {
    assets: Array<{
      id: string;
      title: string;
      usageStatus: string;
      license?: string;
      attribution?: string;
      provider?: string;
      focal?: string;
      publicationEligible: boolean;
    }>;
    typographyLed: boolean;
  } | null;
  premises: string[];
  compositions: string[];
  critic: {
    ok: boolean;
    scores: Record<string, number>;
    reasons: string[];
    repairHistory: string[];
  } | null;
  websitePreviewUrls: string[];
  portalPreviewUrls: string[];
};

export default function ExperienceAcceptanceClient({ rows }: { rows: Row[] }) {
  const [approvals, setApprovals] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  async function submit(projectId: string, decision: 'approve' | 'reject') {
    setBusy(projectId);
    setMessage(null);
    try {
      const res = await fetch('/api/admin/factory/experience-acceptance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, decision }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string };
      if (!res.ok || !body.ok) {
        setMessage(body.error || 'Approval failed');
      } else {
        setApprovals((prev) => ({ ...prev, [projectId]: decision }));
        setMessage(`${projectId}: ${decision}`);
      }
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-10">
      {message ? (
        <p className="border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
          {message}
        </p>
      ) : null}

      {rows.map((row) => (
        <article key={row.projectId} className="border border-neutral-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: GOLD }}>
                {row.label}
              </p>
              <h2 className="mt-1 text-2xl font-black" style={{ color: NAVY }}>
                {row.client}
              </h2>
              <p className="mt-1 text-xs text-neutral-500">{row.projectId}</p>
            </div>
            <span className="rounded-full bg-[#FAF8F3] px-3 py-1 text-xs font-bold uppercase tracking-wider text-neutral-600">
              {approvals[row.projectId] || (row.found ? 'pending review' : 'missing project')}
            </span>
          </div>

          {!row.found ? (
            <p className="mt-4 text-sm text-neutral-500">
              Project not found in this runtime. Generate via Quick Launch first.
            </p>
          ) : (
            <>
              <section className="mt-6">
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: NAVY }}>
                  Research summary
                </h3>
                {row.knowledgeSummary ? (
                  <div className="mt-2 text-sm leading-6 text-neutral-600">
                    <p>
                      <strong>{row.knowledgeSummary.name}</strong> · {row.knowledgeSummary.claims}{' '}
                      claims · gate {row.knowledgeSummary.validation.ok ? 'pass' : 'fail'}
                    </p>
                    <p className="mt-2">{row.knowledgeSummary.biography}</p>
                    <p className="mt-2 text-xs">
                      Orgs: {row.knowledgeSummary.organizations.join(' · ') || '—'}
                    </p>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-neutral-500">No subject_knowledge_pack yet.</p>
                )}
              </section>

              <section className="mt-6">
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: NAVY }}>
                  Media inventory
                </h3>
                {row.mediaSummary ? (
                  <ul className="mt-2 space-y-2 text-sm text-neutral-600">
                    {row.mediaSummary.assets.length === 0 ? (
                      <li>
                        Typography-led ({row.mediaSummary.typographyLed ? 'yes' : 'no'}) — no preview
                        assets.
                      </li>
                    ) : (
                      row.mediaSummary.assets.slice(0, 12).map((a) => (
                        <li key={a.id} className="border-b border-neutral-100 pb-2">
                          <strong>{a.title}</strong> · {a.usageStatus} · {a.provider || '—'}
                          {a.license ? ` · ${a.license}` : ''}
                          {a.focal ? ` · focal:${a.focal}` : ''}
                          {a.publicationEligible ? ' · PUBLISHABLE' : ' · not publishable'}
                          {a.attribution ? (
                            <span className="mt-1 block text-xs text-neutral-500">{a.attribution}</span>
                          ) : null}
                        </li>
                      ))
                    )}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-neutral-500">No media_brand_pack yet.</p>
                )}
              </section>

              <section className="mt-6 grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: NAVY }}>
                    Website concepts
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {row.websitePreviewUrls.map((href, i) => (
                      <li key={href}>
                        <Link href={href} className="font-semibold underline" style={{ color: NAVY }}>
                          {row.premises[i] || `Concept ${i + 1}`}
                        </Link>
                        <p className="text-xs text-neutral-500">{row.compositions[i]}</p>
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: NAVY }}>
                    Portal concepts
                  </h3>
                  <ul className="mt-2 space-y-2 text-sm">
                    {row.portalPreviewUrls.map((href, i) => (
                      <li key={href}>
                        <Link href={href} className="font-semibold underline" style={{ color: NAVY }}>
                          Portal · {row.premises[i] || `Concept ${i + 1}`}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              </section>

              <section className="mt-6">
                <h3 className="text-sm font-black uppercase tracking-wider" style={{ color: NAVY }}>
                  Critic
                </h3>
                {row.critic ? (
                  <div className="mt-2 text-sm text-neutral-600">
                    <p>
                      Result: <strong>{row.critic.ok ? 'pass' : 'fail'}</strong>
                    </p>
                    <p className="mt-1 text-xs">
                      Scores: {JSON.stringify(row.critic.scores)}
                    </p>
                    {row.critic.reasons.length ? (
                      <ul className="mt-2 list-disc pl-5">
                        {row.critic.reasons.map((r) => (
                          <li key={r}>{r}</li>
                        ))}
                      </ul>
                    ) : null}
                    {row.critic.repairHistory.length ? (
                      <p className="mt-2 text-xs text-neutral-500">
                        Repairs: {row.critic.repairHistory.join(' · ')}
                      </p>
                    ) : null}
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-neutral-500">No critic result yet.</p>
                )}
              </section>

              <div className="mt-6 flex flex-wrap gap-3">
                <button
                  type="button"
                  disabled={busy === row.projectId}
                  onClick={() => void submit(row.projectId, 'approve')}
                  className="bg-[#1B2B4D] px-4 py-2 text-xs font-black uppercase tracking-wider text-white disabled:opacity-50"
                >
                  Approve subject
                </button>
                <button
                  type="button"
                  disabled={busy === row.projectId}
                  onClick={() => void submit(row.projectId, 'reject')}
                  className="border border-neutral-300 bg-white px-4 py-2 text-xs font-black uppercase tracking-wider text-neutral-700 disabled:opacity-50"
                >
                  Reject subject
                </button>
              </div>
            </>
          )}
        </article>
      ))}
    </div>
  );
}
