'use client';

import { useState } from 'react';
import type { OpportunityRecord, OpportunityStatus } from '@/lib/partner-network';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';
const STATUSES: OpportunityStatus[] = ['Lead', 'Proposal', 'Won', 'Paid', 'Commission Paid'];

const STATUS_STYLES: Record<OpportunityStatus, { bg: string; color: string }> = {
  Lead: { bg: '#EFF6FF', color: '#1D4ED8' },
  Proposal: { bg: '#FFFBEB', color: '#92400E' },
  Won: { bg: '#ECFDF5', color: '#065F46' },
  Paid: { bg: '#F0FDF4', color: '#166534' },
  'Commission Paid': { bg: '#F5F3FF', color: '#5B21B6' },
};

function fmt(n: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
  }).format(n);
}

function fmtDate(str: string): string {
  if (!str) return '';
  const d = new Date(str + 'T12:00:00');
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

interface Props {
  initialData: OpportunityRecord[];
}

export default function CommissionsDashboard({ initialData }: Props) {
  const [data, setData] = useState(initialData);
  const [partnerFilter, setPartnerFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [updating, setUpdating] = useState<Record<string, boolean>>({});
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  const totalOwed = data
    .filter((r) => r.status !== 'Commission Paid')
    .reduce((sum, r) => sum + r.commissionAmount, 0);
  const totalPaid = data
    .filter((r) => r.status === 'Commission Paid')
    .reduce((sum, r) => sum + r.commissionAmount, 0);

  const uniquePartners = Array.from(
    new Set(data.map((r) => r.partnerName).filter(Boolean))
  ).sort();

  const displayed = data.filter((row) => {
    const matchPartner =
      !partnerFilter || row.partnerName.toLowerCase().includes(partnerFilter.toLowerCase());
    const matchStatus = !statusFilter || row.status === statusFilter;
    return matchPartner && matchStatus;
  });

  async function handleStatusChange(id: string, newStatus: OpportunityStatus) {
    setUpdating((prev) => ({ ...prev, [id]: true }));
    setUpdateErrors((prev) => ({ ...prev, [id]: '' }));

    try {
      const res = await fetch(`/api/admin/commissions/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const err = (await res.json()) as { error?: string };
        setUpdateErrors((prev) => ({ ...prev, [id]: err.error ?? 'Update failed.' }));
      } else {
        setData((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
      }
    } catch {
      setUpdateErrors((prev) => ({ ...prev, [id]: 'Network error.' }));
    }

    setUpdating((prev) => ({ ...prev, [id]: false }));
  }

  return (
    <div className="min-h-screen bg-neutral-50">
      <header style={{ backgroundColor: NAVY }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Efficiency Architects
            </p>
            <h1 className="text-xl font-extrabold uppercase tracking-widest text-white">
              Commission Dashboard
            </h1>
          </div>
          <a
            href="/api/admin/logout"
            className="text-xs font-semibold text-blue-200 hover:text-white transition"
          >
            Sign Out
          </a>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          <div className="bg-white border border-neutral-200 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Total Commission Owed
            </p>
            <p className="text-2xl font-extrabold" style={{ color: NAVY }}>
              {fmt(totalOwed)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Excludes Commission Paid</p>
          </div>
          <div className="bg-white border border-neutral-200 p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-neutral-500 mb-1">
              Total Commission Paid
            </p>
            <p className="text-2xl font-extrabold" style={{ color: '#065F46' }}>
              {fmt(totalPaid)}
            </p>
            <p className="text-xs text-neutral-400 mt-1">Status = Commission Paid</p>
          </div>
        </div>

        <div className="flex flex-wrap items-end gap-4 mb-6">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Partner
            </label>
            <select
              className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-800"
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
            >
              <option value="">All Partners</option>
              {uniquePartners.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-neutral-600 mb-1">
              Status
            </label>
            <select
              className="border border-neutral-300 bg-white px-3 py-2 text-sm outline-none focus:border-neutral-800"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          {(partnerFilter || statusFilter) && (
            <button
              className="text-xs font-semibold text-neutral-500 hover:text-neutral-800 transition px-3 py-2 border border-neutral-200 bg-white"
              onClick={() => {
                setPartnerFilter('');
                setStatusFilter('');
              }}
            >
              Clear Filters
            </button>
          )}
        </div>

        {displayed.length === 0 ? (
          <div className="bg-white border border-neutral-200 p-10 text-center">
            <p className="text-neutral-400 text-sm">No commission records found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full bg-white border border-neutral-200 text-sm">
              <thead>
                <tr style={{ backgroundColor: NAVY }}>
                  {[
                    'Opportunity',
                    'Partner',
                    'Project Value',
                    'Commission %',
                    'Commission Amt',
                    'Status',
                    'Date',
                  ].map((h) => (
                    <th
                      key={h}
                      className="px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-blue-100"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {displayed.map((row) => {
                  const s = STATUS_STYLES[row.status] ?? { bg: '#F3F4F6', color: '#4B5563' };
                  return (
                    <tr key={row.id} className="hover:bg-neutral-50 transition">
                      <td className="px-4 py-3">
                        <div className="font-medium text-neutral-800">{row.opportunityName}</div>
                        {row.referralOrganization && (
                          <div className="text-xs text-neutral-400 mt-0.5">
                            {row.referralOrganization}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-700">{row.partnerName}</td>
                      <td className="px-4 py-3 text-neutral-700">{fmt(row.projectValue)}</td>
                      <td className="px-4 py-3 text-neutral-700">
                        {(row.commissionPercentage * 100).toFixed(0)}%
                      </td>
                      <td className="px-4 py-3 font-semibold" style={{ color: NAVY }}>
                        {fmt(row.commissionAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          className="text-xs font-semibold px-2 py-1 rounded border-0 outline-none cursor-pointer disabled:opacity-60"
                          style={{ backgroundColor: s.bg, color: s.color }}
                          value={row.status}
                          disabled={!!updating[row.id]}
                          onChange={(e) =>
                            handleStatusChange(row.id, e.target.value as OpportunityStatus)
                          }
                        >
                          {STATUSES.map((st) => (
                            <option key={st} value={st}>
                              {st}
                            </option>
                          ))}
                        </select>
                        {updateErrors[row.id] && (
                          <p className="text-xs text-red-600 mt-1">{updateErrors[row.id]}</p>
                        )}
                      </td>
                      <td className="px-4 py-3 text-neutral-500 text-xs">
                        {fmtDate(row.dateCreated)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        <p className="text-xs text-neutral-400 mt-3 text-right">
          {displayed.length} of {data.length} record{data.length !== 1 ? 's' : ''}
        </p>
      </main>
    </div>
  );
}
