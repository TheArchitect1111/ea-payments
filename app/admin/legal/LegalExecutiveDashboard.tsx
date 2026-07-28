'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CREAM, GOLD, NAVY } from '@/lib/design-system';
import { LegalAuditTimeline } from '@/app/components/trust/LegalAuditTimeline';
import { LegalStatusDashboard } from '@/app/components/trust/LegalStatusDashboard';
import type { ClientLegalProfile, LegalAuditEvent, LegalExecutiveMetrics, UpcomingLegalRelease } from '@/lib/trust-engine/types';
import type { ClientLegalDocRow } from '@/lib/trust-engine/types';

type RecentAcceptance = {
  userId: string;
  productId: string;
  docType: string;
  version: string;
  acceptedAt: string;
  href: string;
  clientId: string;
  organizationName: string;
  email: string;
};

export type LegalExecutiveDashboardProps = {
  metrics: LegalExecutiveMetrics;
  clients: ClientLegalProfile[];
  recentAcceptances: RecentAcceptance[];
  requiringReacceptance: ClientLegalProfile[];
  upcomingReleases: UpcomingLegalRelease[];
  initialAudit: LegalAuditEvent[];
  statusByClient: Record<string, ClientLegalDocRow[]>;
};

export function LegalExecutiveDashboard({
  metrics,
  clients,
  recentAcceptances,
  requiringReacceptance,
  upcomingReleases,
  initialAudit,
  statusByClient,
}: LegalExecutiveDashboardProps) {
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [productFilter, setProductFilter] = useState('all');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [audit, setAudit] = useState(initialAudit);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return clients.filter((c) => {
      if (productFilter !== 'all' && c.productId !== productFilter) return false;
      if (statusFilter === 'reaccept' && !c.requiresReacceptance) return false;
      if (statusFilter === 'msa_pending' && c.msaStatus === 'signed') return false;
      if (statusFilter === 'sow_pending' && c.sowStatus === 'signed') return false;
      if (!needle) return true;
      return (
        c.displayName.toLowerCase().includes(needle) ||
        c.organizationName.toLowerCase().includes(needle) ||
        c.email.toLowerCase().includes(needle) ||
        c.productId.includes(needle)
      );
    });
  }, [clients, q, statusFilter, productFilter]);

  const selected = clients.find((c) => c.clientId === selectedId) ?? null;

  async function loadClientAudit(clientId: string) {
    setSelectedId(clientId);
    try {
      const res = await fetch(`/api/admin/legal/clients/${encodeURIComponent(clientId)}`);
      const data = (await res.json()) as { audit?: LegalAuditEvent[] };
      if (data.audit) setAudit(data.audit);
    } catch {
      // keep prior audit
    }
  }

  const metricCards = [
    { label: 'Total clients', value: String(metrics.totalClients) },
    { label: 'Privacy accepted', value: `${metrics.privacyAcceptedPct}%` },
    { label: 'Terms accepted', value: `${metrics.termsAcceptedPct}%` },
    { label: 'AI disclosure', value: `${metrics.aiDisclosureAcceptedPct}%` },
    { label: 'MSA signed', value: `${metrics.msaSignedPct}%` },
    { label: 'SOW signed', value: `${metrics.sowSignedPct}%` },
    {
      label: 'Reacceptance needed',
      value: String(metrics.documentsRequiringReacceptance),
    },
  ];

  return (
    <div style={{ display: 'grid', gap: '2.5rem' }}>
      <header>
        <p
          style={{
            margin: 0,
            fontSize: '0.75rem',
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            fontWeight: 700,
            color: '#775d12',
          }}
        >
          Trust Engine
        </p>
        <h1 style={{ margin: '0.4rem 0 0.5rem', color: NAVY, fontSize: '2rem', fontWeight: 800 }}>
          Legal governance
        </h1>
        <p style={{ margin: 0, color: '#555', maxWidth: '36rem', lineHeight: 1.6 }}>
          Acceptance health across the Efficiency Architects product family — not a compliance
          spreadsheet.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
          gap: '0.85rem',
        }}
      >
        {metricCards.map((m) => (
          <div
            key={m.label}
            style={{
              background: CREAM,
              borderTop: `3px solid ${GOLD}`,
              padding: '1rem 0.9rem',
            }}
          >
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 800, color: NAVY }}>{m.value}</p>
            <p style={{ margin: '0.25rem 0 0', fontSize: '0.75rem', color: '#666' }}>{m.label}</p>
          </div>
        ))}
      </div>

      <section>
        <h2 style={{ margin: '0 0 0.75rem', color: NAVY, fontSize: '1.15rem' }}>Find a client</h2>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.65rem', marginBottom: '1rem' }}>
          <input
            type="search"
            placeholder="Client, organization, email…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            style={{
              flex: '1 1 220px',
              padding: '0.65rem 0.75rem',
              border: '1px solid #ccc',
              background: '#fff',
            }}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ padding: '0.65rem', border: '1px solid #ccc' }}
          >
            <option value="all">All statuses</option>
            <option value="reaccept">Requires reacceptance</option>
            <option value="msa_pending">MSA not signed</option>
            <option value="sow_pending">SOW not signed</option>
          </select>
          <select
            value={productFilter}
            onChange={(e) => setProductFilter(e.target.value)}
            style={{ padding: '0.65rem', border: '1px solid #ccc' }}
          >
            <option value="all">All products</option>
            <option value="simplifi">Simplifi</option>
            <option value="amplifi">Amplifi</option>
            <option value="magnifi">Magnifi</option>
            <option value="portal_products">Portal products</option>
            <option value="executive_portals">Executive portals</option>
            <option value="pulse">Pulse</option>
          </select>
        </div>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {filtered.map((c) => (
            <li key={c.clientId}>
              <button
                type="button"
                onClick={() => void loadClientAudit(c.clientId)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  background: selectedId === c.clientId ? CREAM : 'transparent',
                  border: 'none',
                  borderBottom: '1px solid #e8e4dc',
                  padding: '0.85rem 0.5rem',
                  cursor: 'pointer',
                }}
              >
                <span style={{ fontWeight: 700, color: NAVY }}>{c.displayName}</span>
                <span style={{ color: '#666', fontSize: '0.85rem' }}>
                  {' '}
                  · {c.organizationName} · {c.email} · {c.productId}
                  {c.requiresReacceptance ? ' · Update required' : ''}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </section>

      {selected ? (
        <section>
          <h2 style={{ margin: '0 0 1rem', color: NAVY }}>
            {selected.displayName} — acceptance history
          </h2>
          <LegalStatusDashboard
            documents={statusByClient[selected.clientId] ?? []}
            title="Document status"
            lede={`${selected.organizationName} · ${selected.productId}`}
          />
          <div style={{ marginTop: '1.5rem' }}>
            <LegalAuditTimeline events={audit} title="Complete history" />
          </div>
        </section>
      ) : null}

      <section>
        <h2 style={{ margin: '0 0 0.75rem', color: NAVY, fontSize: '1.15rem' }}>
          Documents requiring reacceptance
        </h2>
        {requiringReacceptance.length === 0 ? (
          <p style={{ color: '#666' }}>All tracked clients are current.</p>
        ) : (
          <ul style={{ margin: 0, paddingLeft: '1.1rem', color: '#444' }}>
            {requiringReacceptance.map((c) => (
              <li key={c.clientId} style={{ marginBottom: '0.35rem' }}>
                {c.displayName} ({c.organizationName})
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h2 style={{ margin: '0 0 0.75rem', color: NAVY, fontSize: '1.15rem' }}>
          Recent acceptances
        </h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {recentAcceptances.slice(0, 8).map((a) => (
            <li
              key={`${a.clientId}-${a.docType}-${a.acceptedAt}`}
              style={{
                padding: '0.65rem 0',
                borderBottom: '1px solid #eee',
                fontSize: '0.9rem',
                color: '#444',
              }}
            >
              <strong style={{ color: NAVY }}>{a.organizationName}</strong> accepted {a.docType}{' '}
              v{a.version} · {new Date(a.acceptedAt).toLocaleString()}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 style={{ margin: '0 0 0.75rem', color: NAVY, fontSize: '1.15rem' }}>
          Upcoming version releases
        </h2>
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {upcomingReleases.map((u) => (
            <li
              key={`${u.docType}-${u.toVersion}`}
              style={{ background: CREAM, padding: '1rem', marginBottom: '0.65rem' }}
            >
              <p style={{ margin: 0, fontWeight: 700, color: NAVY }}>
                {u.title} {u.fromVersion} → {u.toVersion}
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.85rem', color: '#666' }}>
                Planned {u.plannedEffectiveDate}
                {u.notes ? ` · ${u.notes}` : ''}
              </p>
            </li>
          ))}
        </ul>
      </section>

      <p style={{ fontSize: '0.85rem', color: '#777' }}>
        Public Trust Center:{' '}
        <Link href="/trust" style={{ color: NAVY }}>
          /trust
        </Link>
      </p>
    </div>
  );
}
