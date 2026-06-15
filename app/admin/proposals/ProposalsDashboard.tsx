'use client';

import { useState } from 'react';
import type { ProposalWithAssessment } from '@/lib/airtable';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

type ProposalStatus =
  | 'Pending Review'
  | 'Approved'
  | 'Sent'
  | 'Rejected'
  | 'Discovery Call Requested'
  | 'Approved & Paid';

const ALL_STATUSES: ProposalStatus[] = [
  'Pending Review',
  'Approved',
  'Sent',
  'Rejected',
  'Discovery Call Requested',
  'Approved & Paid',
];

const STATUS_STYLES: Record<string, { bg: string; color: string }> = {
  'Pending Review':           { bg: '#FFFBEB', color: '#92400E' },
  'Approved':                 { bg: '#ECFDF5', color: '#065F46' },
  'Sent':                     { bg: '#EFF6FF', color: '#1D4ED8' },
  'Rejected':                 { bg: '#FEF2F2', color: '#991B1B' },
  'Discovery Call Requested': { bg: '#F5F3FF', color: '#5B21B6' },
  'Approved & Paid':          { bg: '#F0FDF4', color: '#166534' },
};

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(str: string | undefined): string {
  if (!str) return '';
  const d = new Date(str + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props {
  initialData: ProposalWithAssessment[];
}

interface EditState {
  fee: string;
  scope: string;
}

export default function ProposalsDashboard({ initialData }: Props) {
  const [proposals, setProposals] = useState(initialData);
  const [statusFilter, setStatusFilter] = useState<string>('Pending Review');
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [edits, setEdits] = useState<Record<string, EditState>>(() => {
    const init: Record<string, EditState> = {};
    for (const p of initialData) {
      init[p.id] = { fee: String(p.recommendedFee), scope: p.scopeSummary };
    }
    return init;
  });

  const displayed = proposals.filter(
    (p) => !statusFilter || p.status === statusFilter
  );

  const pendingCount = proposals.filter((p) => p.status === 'Pending Review').length;

  function setError(id: string, msg: string) {
    setErrors((prev) => ({ ...prev, [id]: msg }));
  }

  function clearError(id: string) {
    setErrors((prev) => ({ ...prev, [id]: '' }));
  }

  async function callPatch(
    proposal: ProposalWithAssessment,
    body: Record<string, unknown>
  ): Promise<boolean> {
    const id = proposal.id;
    setUpdating((prev) => ({ ...prev, [id]: true }));
    clearError(id);

    try {
      const res = await fetch(`/api/admin/proposals/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = (await res.json()) as { error?: string };
        setError(id, data.error ?? 'Update failed.');
        return false;
      }
      return true;
    } catch {
      setError(id, 'Network error.');
      return false;
    } finally {
      setUpdating((prev) => ({ ...prev, [id]: false }));
    }
  }

  async function handleApprove(proposal: ProposalWithAssessment) {
    const ok = await callPatch(proposal, {
      action: 'approve',
      proposalId: proposal.proposalId,
      contactName: proposal.contactName,
      email: proposal.email,
      projectTypeLabel: proposal.projectTypeLabel,
      recommendedFee: proposal.recommendedFee,
      scopeSummary: proposal.scopeSummary,
    });
    if (ok) {
      const today = new Date().toISOString().slice(0, 10);
      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposal.id ? { ...p, status: 'Approved', dateApproved: today } : p
        )
      );
    }
  }

  async function handleReject(proposal: ProposalWithAssessment) {
    const ok = await callPatch(proposal, { action: 'reject' });
    if (ok) {
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, status: 'Rejected' } : p))
      );
    }
  }

  async function handleDiscovery(proposal: ProposalWithAssessment) {
    const ok = await callPatch(proposal, { action: 'discovery' });
    if (ok) {
      setProposals((prev) =>
        prev.map((p) =>
          p.id === proposal.id ? { ...p, status: 'Discovery Call Requested' } : p
        )
      );
    }
  }

  async function handleSaveFee(proposal: ProposalWithAssessment) {
    const raw = edits[proposal.id]?.fee ?? '';
    const fee = parseFloat(raw.replace(/[^0-9.]/g, ''));
    if (!Number.isFinite(fee) || fee < 0) {
      setError(proposal.id, 'Enter a valid dollar amount.');
      return;
    }
    const ok = await callPatch(proposal, { action: 'update_fee', recommendedFee: fee });
    if (ok) {
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, recommendedFee: fee } : p))
      );
    }
  }

  async function handleSaveScope(proposal: ProposalWithAssessment) {
    const scope = edits[proposal.id]?.scope ?? '';
    const ok = await callPatch(proposal, { action: 'update_scope', scopeSummary: scope });
    if (ok) {
      setProposals((prev) =>
        prev.map((p) => (p.id === proposal.id ? { ...p, scopeSummary: scope } : p))
      );
    }
  }

  function updateEdit(id: string, field: keyof EditState, value: string) {
    setEdits((prev) => ({
      ...prev,
      [id]: { ...(prev[id] ?? { fee: '', scope: '' }), [field]: value },
    }));
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header style={{ backgroundColor: NAVY }} className="px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Efficiency Architects
            </p>
            <h1 className="text-xl font-extrabold uppercase tracking-widest text-white">
              Proposal Dashboard
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <a
              href="/admin/commissions"
              className="text-xs font-semibold text-blue-200 hover:text-white transition"
            >
              Commissions
            </a>
            <a
              href="/api/admin/logout"
              className="text-xs font-semibold text-blue-200 hover:text-white transition"
            >
              Sign Out
            </a>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {ALL_STATUSES.slice(0, 4).map((s) => {
            const count = proposals.filter((p) => p.status === s).length;
            const style = STATUS_STYLES[s] ?? { bg: '#F3F4F6', color: '#374151' };
            return (
              <div
                key={s}
                className="bg-white border border-neutral-200 p-4 cursor-pointer hover:border-neutral-400 transition"
                onClick={() => setStatusFilter(statusFilter === s ? '' : s)}
                style={{ borderLeftColor: style.color, borderLeftWidth: 3 }}
              >
                <p className="text-xl font-extrabold" style={{ color: NAVY }}>
                  {count}
                </p>
                <p className="text-xs text-neutral-500 mt-0.5 leading-tight">{s}</p>
              </div>
            );
          })}
        </div>

        {/* Filter bar */}
        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Status Filter
            </label>
            <select
              className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-800"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {ALL_STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {statusFilter && (
            <button
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition px-3 py-2 border border-neutral-200 bg-white"
              onClick={() => setStatusFilter('')}
            >
              Clear Filter
            </button>
          )}
          <p className="ml-auto text-xs text-neutral-400">
            {displayed.length} of {proposals.length} proposal{proposals.length !== 1 ? 's' : ''}
            {pendingCount > 0 && statusFilter !== 'Pending Review' && (
              <span className="ml-2 font-semibold" style={{ color: '#92400E' }}>
                ({pendingCount} pending review)
              </span>
            )}
          </p>
        </div>

        {/* Proposal cards */}
        {displayed.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-10 text-center">
            <p className="text-neutral-400 text-sm">No proposals match this filter.</p>
          </div>
        ) : (
          <div className="space-y-6">
            {displayed.map((proposal) => {
              const statusStyle = STATUS_STYLES[proposal.status] ?? {
                bg: '#F3F4F6',
                color: '#374151',
              };
              const isUpdating = !!updating[proposal.id];
              const err = errors[proposal.id];
              const edit = edits[proposal.id] ?? { fee: String(proposal.recommendedFee), scope: proposal.scopeSummary };

              return (
                <div
                  key={proposal.id}
                  className="bg-white border border-neutral-200"
                >
                  {/* Card header */}
                  <div
                    className="px-6 py-4 flex flex-wrap items-start gap-3 justify-between"
                    style={{ backgroundColor: NAVY }}
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className="text-xs font-bold px-2 py-0.5 shrink-0"
                          style={{ backgroundColor: statusStyle.bg, color: statusStyle.color }}
                        >
                          {proposal.status}
                        </span>
                        <span className="text-white font-bold text-base truncate">
                          {proposal.businessName || proposal.contactName}
                        </span>
                      </div>
                      <p className="text-sm text-blue-200 mt-1">
                        {proposal.contactName}
                        {proposal.email && (
                          <span className="text-blue-300"> &middot; {proposal.email}</span>
                        )}
                      </p>
                      {proposal.dateApproved && (
                        <p className="text-xs text-blue-300 mt-0.5">
                          Approved {fmtDate(proposal.dateApproved)}
                        </p>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {proposal.status === 'Pending Review' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleApprove(proposal)}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#065F46', color: '#FFFFFF' }}
                        >
                          Approve &amp; Send
                        </button>
                      )}
                      {proposal.status === 'Pending Review' && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleDiscovery(proposal)}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#5B21B6', color: '#FFFFFF' }}
                        >
                          Discovery Call
                        </button>
                      )}
                      {(proposal.status === 'Pending Review' ||
                        proposal.status === 'Discovery Call Requested') && (
                        <button
                          disabled={isUpdating}
                          onClick={() => handleReject(proposal)}
                          className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                          style={{ backgroundColor: '#991B1B', color: '#FFFFFF' }}
                        >
                          Reject
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Error banner */}
                  {err && (
                    <div className="px-6 py-2 bg-red-50 border-b border-red-200 text-sm text-red-700">
                      {err}
                    </div>
                  )}

                  <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left column: Assessment */}
                    <div className="space-y-4">
                      <SectionLabel label="Assessment" color={GOLD} />

                      <div className="flex flex-wrap gap-4 text-sm">
                        <DataPair label="Team Size" value={proposal.teamSize != null ? String(proposal.teamSize) : 'N/A'} />
                        <DataPair label="Revenue" value={proposal.revenueRange ?? 'N/A'} />
                        <DataPair label="Complexity" value={proposal.businessComplexity ?? 'N/A'} />
                      </div>

                      {proposal.operationalChallenges && proposal.operationalChallenges.length > 0 && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Operational Challenges
                          </p>
                          <ul className="space-y-0.5">
                            {proposal.operationalChallenges.map((c, i) => (
                              <li key={i} className="text-sm text-neutral-700 flex items-start gap-1.5">
                                <span className="mt-1 shrink-0 w-1 h-1 rounded-full bg-neutral-400 inline-block" />
                                {c}
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {proposal.growthGoals && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Growth Goals
                          </p>
                          <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                            {proposal.growthGoals}
                          </p>
                        </div>
                      )}

                      {proposal.capacityConstraints && (
                        <div>
                          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Capacity Constraints
                          </p>
                          <p className="text-sm text-neutral-700 whitespace-pre-wrap">
                            {proposal.capacityConstraints}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Right column: Analysis + Pricing + Scope */}
                    <div className="space-y-4">
                      <SectionLabel label="Analysis" color={GOLD} />

                      <div className="flex flex-wrap gap-4 text-sm">
                        <DataPair
                          label="Capacity Score"
                          value={`${proposal.capacityScore} (${proposal.scoreBand})`}
                        />
                        <DataPair
                          label="Recovery"
                          value={`${proposal.weeklyTimeRecovery} hrs/wk`}
                        />
                      </div>

                      {proposal.primaryConstraint && (
                        <DataPair
                          label="Primary Constraint"
                          value={proposal.primaryConstraint}
                          fullWidth
                        />
                      )}

                      <DataPair
                        label="Annual Opportunity"
                        value={`${fmt(proposal.opportunityLow)} to ${fmt(proposal.opportunityHigh)}`}
                        fullWidth
                      />

                      <div className="border-t border-neutral-100 pt-4">
                        <SectionLabel label="Pricing" color={GOLD} />
                        <div className="mt-3 flex flex-wrap gap-4">
                          <DataPair label="Project Type" value={proposal.projectTypeLabel || proposal.recommendedProjectType} fullWidth />
                          <DataPair label="Raw Fee" value={fmt(proposal.rawFee)} />
                        </div>

                        {/* Editable fee */}
                        <div className="mt-3">
                          <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
                            Recommended Fee
                          </p>
                          <div className="flex gap-2 items-center">
                            <input
                              type="text"
                              className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 w-36"
                              value={edit.fee}
                              onChange={(e) => updateEdit(proposal.id, 'fee', e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') void handleSaveFee(proposal);
                              }}
                              disabled={isUpdating}
                              placeholder="0"
                            />
                            <button
                              onClick={() => handleSaveFee(proposal)}
                              disabled={isUpdating || edit.fee === String(proposal.recommendedFee)}
                              className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40 disabled:cursor-not-allowed"
                              style={{ backgroundColor: NAVY }}
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      </div>

                      <div className="border-t border-neutral-100 pt-4">
                        <SectionLabel label="Scope Notes (Internal)" color={GOLD} />
                        <div className="mt-3">
                          <textarea
                            className="w-full border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-800 focus:ring-1 focus:ring-neutral-800 resize-y"
                            rows={3}
                            value={edit.scope}
                            onChange={(e) => updateEdit(proposal.id, 'scope', e.target.value)}
                            disabled={isUpdating}
                            placeholder="Internal notes on scope, custom requirements, or context for this proposal..."
                          />
                          <button
                            onClick={() => handleSaveScope(proposal)}
                            disabled={isUpdating || edit.scope === proposal.scopeSummary}
                            className="mt-1.5 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-white disabled:opacity-40 disabled:cursor-not-allowed"
                            style={{ backgroundColor: NAVY }}
                          >
                            Save Notes
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Proposal ID footer */}
                  <div className="px-6 py-2 border-t border-neutral-100 bg-neutral-50 flex justify-between items-center">
                    <span className="text-xs text-neutral-400">{proposal.proposalId}</span>
                    {proposal.dateApproved && (
                      <span className="text-xs text-neutral-400">
                        Approved {fmtDate(proposal.dateApproved)}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function SectionLabel({ label, color }: { label: string; color: string }) {
  return (
    <p
      className="text-xs font-bold uppercase tracking-widest"
      style={{ color }}
    >
      {label}
    </p>
  );
}

function DataPair({
  label,
  value,
  fullWidth = false,
}: {
  label: string;
  value: string;
  fullWidth?: boolean;
}) {
  return (
    <div className={fullWidth ? 'w-full' : ''}>
      <p className="text-xs font-bold uppercase tracking-wider text-neutral-500">{label}</p>
      <p className="text-sm text-neutral-800 mt-0.5">{value}</p>
    </div>
  );
}
