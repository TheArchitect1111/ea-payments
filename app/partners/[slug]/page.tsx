import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { EA_PARTNER_COOKIE } from '@/lib/partner-portal-auth';
import { verifyPartnerSession } from '@/lib/partner-session';
import { getPartnerDashboard, summarizePartnerDashboard } from '@/lib/partner-portal-data';
import PartnerDashboardClient from './PartnerDashboardClient';
import '../partners.css';

export const dynamic = 'force-dynamic';

function stageClass(stage: string) {
  if (/won|complet|paid/i.test(stage)) return 'pp-badge pp-badge-won';
  return 'pp-badge';
}

export default async function PartnerDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get(EA_PARTNER_COOKIE)?.value;
  if (!token) redirect('/partners/login');

  const session = await verifyPartnerSession(token);
  if (!session || session.slug !== slug) redirect('/partners/login');

  const profile = {
    slug: session.slug,
    name: session.name,
    tier: session.tier,
    commissionRate: session.commissionRate,
    overrideRate: null,
  };

  const data = await getPartnerDashboard(session.partnerId, profile);
  const stats = summarizePartnerDashboard(data);
  const ratePct =
    data.partner.commissionRate != null ? `${Math.round(data.partner.commissionRate * 100)}%` : '—';

  return (
    <div className="pp-page">
      <header className="pp-nav">
        <div className="pp-nav-brand">
          <Image src="/ea-logo.png" alt="" width={40} height={40} className="pp-nav-logo" />
          <div>
            <strong style={{ color: '#1B2B4D' }}>Partner Portal</strong>
            {data.partner.tier && <span className="pp-tier">{data.partner.tier}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/admin/commissions" className="pp-logout" style={{ color: '#1B2B4D' }}>
            Command Center
          </Link>
          <a href="/api/partners/logout" className="pp-logout">
            Log out
          </a>
        </div>
      </header>

      <main className="pp-main">
        <h1 className="pp-hero-title">Welcome, {data.partner.name || slug}</h1>
        <p style={{ color: '#6B7280', margin: 0 }}>
          Commission rate: {ratePct} · Synced with Command Center
        </p>

        <div className="pp-stats">
          <div className="pp-stat">
            <p className="pp-stat-label">Total referrals</p>
            <p className="pp-stat-value">{stats.totalOpportunities}</p>
          </div>
          <div className="pp-stat">
            <p className="pp-stat-label">Active pipeline</p>
            <p className="pp-stat-value">{stats.activeCount}</p>
          </div>
          <div className="pp-stat">
            <p className="pp-stat-label">Won / paid</p>
            <p className="pp-stat-value">{stats.wonCount}</p>
          </div>
          <div className="pp-stat">
            <p className="pp-stat-label">Pending commission</p>
            <p className="pp-stat-value pp-stat-value-gold">
              ${stats.pendingCommission.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="pp-card">
          <h2
            style={{
              margin: '0 0 16px',
              fontSize: 14,
              color: '#6B7280',
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
            }}
          >
            Your pipeline
          </h2>
          {data.opportunities.length === 0 ? (
            <p style={{ color: '#6B7280' }}>
              No opportunities yet. Share assessment and Simplifi links with prospects.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="pp-table">
                <thead>
                  <tr>
                    {['Company', 'Stage', 'Value', 'Commission', 'Status', 'Date'].map((h) => (
                      <th key={h}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.opportunities.map((o) => (
                    <tr key={o.id}>
                      <td>
                        <strong>{o.companyName}</strong>
                      </td>
                      <td>
                        <span className={stageClass(o.stage)}>{o.stage || 'New'}</span>
                      </td>
                      <td>{o.projectValue != null ? `$${o.projectValue.toLocaleString()}` : '—'}</td>
                      <td>
                        {o.commissionAmount != null ? `$${o.commissionAmount.toLocaleString()}` : '—'}
                      </td>
                      <td>{o.commissionStatus || '—'}</td>
                      <td>{o.dateSubmitted || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <PartnerDashboardClient slug={slug} />
      </main>
    </div>
  );
}
