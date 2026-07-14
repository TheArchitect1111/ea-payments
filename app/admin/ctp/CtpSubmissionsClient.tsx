'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { NAVY, GOLD } from '@/lib/design-system';
import type { CtpAdminSubmissionView } from '@/lib/ctp-admin-view';
import CtpAssetManifestPanel from '../_components/CtpAssetManifestPanel';
import CtpReviewSchedulePanel from '../_components/CtpReviewSchedulePanel';

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' });
}

export default function CtpSubmissionsClient({
  initialSubmissions,
}: {
  initialSubmissions: CtpAdminSubmissionView[];
}) {
  const [query, setQuery] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(
    initialSubmissions[0]?.id ?? null,
  );
  const [submissions, setSubmissions] = useState(initialSubmissions);

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return submissions;
    return submissions.filter((submission) =>
      [
        submission.businessName,
        submission.contactName,
        submission.email,
        submission.id,
        submission.proposalId,
        submission.status,
        submission.clientTypeLabel,
        submission.clientType,
      ]
        .join(' ')
        .toLowerCase()
        .includes(needle),
    );
  }, [submissions, query]);

  return (
    <div className="min-h-screen bg-neutral-50">
      <header style={{ backgroundColor: NAVY }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Consider The Possibilities™
            </p>
            <h1 className="text-xl font-extrabold uppercase tracking-widest text-white">
              CTP Submissions
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/admin/proposals" className="text-xs font-semibold text-blue-200 hover:text-white transition">
              Proposals
            </Link>
            <Link href="/admin/master" className="text-xs font-semibold text-blue-200 hover:text-white transition">
              Master
            </Link>
            <a href="/api/admin/logout" className="text-xs font-semibold text-blue-200 hover:text-white transition">
              Sign Out
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[240px]">
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Search submissions
            </label>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Business, contact, proposal ID, status…"
              className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-800"
            />
          </div>
          <p className="text-xs text-neutral-500">
            {filtered.length} submission{filtered.length === 1 ? '' : 's'}
          </p>
        </div>

        {filtered.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-10 text-center">
            <p className="text-sm text-neutral-500">No CTP submissions match this search.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((submission) => {
              const expanded = expandedId === submission.id;
              return (
                <article key={submission.id} className="bg-white border border-neutral-200">
                  <button
                    type="button"
                    onClick={() => setExpandedId(expanded ? null : submission.id)}
                    className="w-full px-6 py-4 text-left flex flex-wrap items-start justify-between gap-3"
                    style={{ backgroundColor: NAVY }}
                  >
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-bold px-2 py-0.5 bg-white/10 text-white">
                          {submission.status}
                        </span>
                        {submission.clientTypeLabel ? (
                          <span
                            className="text-xs font-bold px-2 py-0.5"
                            style={{ backgroundColor: GOLD, color: NAVY }}
                          >
                            {submission.clientTypeLabel}
                          </span>
                        ) : null}
                        <span className="text-white font-bold">{submission.businessName}</span>
                      </div>
                      <p className="text-sm text-blue-200 mt-1">
                        {submission.contactName} · {submission.email}
                      </p>
                      <p className="text-xs text-blue-300 mt-1">
                        {submission.id} · submitted {formatDate(submission.submittedAt)}
                      </p>
                    </div>
                    <div className="text-right text-xs text-blue-200">
                      <p>{submission.assets.length} asset{submission.assets.length === 1 ? '' : 's'}</p>
                      <p className="mt-1">{expanded ? 'Hide details' : 'View details'}</p>
                    </div>
                  </button>

                  {expanded ? (
                    <div className="p-6 space-y-6">
                      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 text-sm">
                        <Meta label="Client type" value={submission.clientTypeLabel || '—'} />
                        <Meta label="Proposal" value={submission.proposalId} />
                        <Meta label="Assessment" value={submission.assessmentId} />
                        <Meta label="Workspace" value={submission.workspaceStatus} />
                        <Meta label="Studio" value={submission.studioStatus} />
                        <Meta label="Portal" value={submission.portalSlug ? `/portal/${submission.portalSlug}` : '—'} />
                        <Meta label="Site" value={submission.siteUrl || '—'} />
                      </div>
                      {submission.siteUrl ? (
                        <p className="text-sm">
                          <a
                            href={submission.siteUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="font-bold underline"
                            style={{ color: NAVY }}
                          >
                            Open live site
                          </a>
                        </p>
                      ) : null}

                      {submission.intakeSummary ? (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                            Intake summary
                          </p>
                          <p className="mt-2 text-sm leading-6 text-neutral-700 whitespace-pre-wrap">
                            {submission.intakeSummary}
                          </p>
                        </div>
                      ) : null}

                      <CtpReviewSchedulePanel
                        submission={submission}
                        onScheduled={(next) => {
                          setSubmissions((current) =>
                            current.map((item) => (item.id === next.id ? next : item)),
                          );
                        }}
                      />

                      <div>
                        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
                          <p className="text-xs font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                            Discovery assets
                          </p>
                          <div className="flex flex-wrap gap-3 text-xs">
                            {submission.creativeCampaignId ? (
                              <Link
                                href={`/admin/creative-studio/campaigns/${submission.creativeCampaignId}`}
                                className="font-semibold text-blue-700 hover:text-blue-900"
                              >
                                Open studio campaign
                              </Link>
                            ) : null}
                            <Link
                              href={`/admin/proposals`}
                              className="font-semibold text-blue-700 hover:text-blue-900"
                            >
                              View proposals
                            </Link>
                          </div>
                        </div>
                        <CtpAssetManifestPanel assets={submission.assets} />
                      </div>
                    </div>
                  ) : null}
                </article>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="mt-1 text-neutral-800 break-all">{value}</p>
    </div>
  );
}
