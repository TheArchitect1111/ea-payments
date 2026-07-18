import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getFieldDemoPack } from '@/lib/field-demo-store';

export const dynamic = 'force-dynamic';

type Props = { params: Promise<{ slug: string }> };

export default async function FieldDemoReportPage({ params }: Props) {
  const { slug } = await params;
  const pack = await getFieldDemoPack(slug);
  if (!pack) notFound();

  const fmt = (n: number) =>
    new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(n);

  return (
    <main
      style={{
        minHeight: '100vh',
        background: '#0B1220',
        color: '#F5F1E8',
        fontFamily: 'Georgia, "Times New Roman", serif',
        padding: '48px 20px 80px',
      }}
    >
      <div style={{ maxWidth: 720, margin: '0 auto' }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: '#C9A844',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Efficiency Architects · Field Demo Findings
        </p>
        <h1 style={{ margin: '16px 0 8px', fontSize: 'clamp(2rem, 5vw, 3rem)', lineHeight: 1.1 }}>
          {pack.snapshot.headline}
        </h1>
        <p style={{ margin: '0 0 28px', fontSize: 18, lineHeight: 1.55, color: 'rgba(245,241,232,0.82)' }}>
          {pack.snapshot.summary}
        </p>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
            gap: 12,
            marginBottom: 32,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <Stat label="Maturity" value={`${pack.snapshot.operationalMaturity}/100`} />
          <Stat label="Admin drag" value={`${pack.snapshot.adminWastePercent}%`} />
          <Stat label="Hours / week" value={`${pack.snapshot.weeklyHoursRecoverable}`} />
          <Stat
            label="Opportunity"
            value={`${fmt(pack.snapshot.annualOpportunityLow)}–${fmt(pack.snapshot.annualOpportunityHigh)}`}
          />
        </div>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, margin: '0 0 12px' }}>Findings</h2>
          <ul style={{ margin: 0, padding: 0, listStyle: 'none' }}>
            {pack.snapshot.findings.map((finding) => (
              <li
                key={`${finding.title}-${finding.detail.slice(0, 24)}`}
                style={{
                  borderTop: '1px solid rgba(245,241,232,0.12)',
                  padding: '14px 0',
                }}
              >
                <p style={{ margin: 0, fontWeight: 700, fontFamily: 'system-ui, sans-serif' }}>
                  {finding.title}
                </p>
                <p style={{ margin: '6px 0 0', color: 'rgba(245,241,232,0.75)', lineHeight: 1.5 }}>
                  {finding.detail}
                </p>
              </li>
            ))}
          </ul>
        </section>

        <section style={{ marginBottom: 32 }}>
          <h2 style={{ fontSize: 22, margin: '0 0 12px' }}>Recommended stack</h2>
          <p style={{ margin: '0 0 8px', color: 'rgba(245,241,232,0.75)' }}>
            {pack.snapshot.scope.timelineLabel} · {pack.snapshot.scope.projectTypeLabel}
          </p>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.7 }}>
            {pack.snapshot.scope.stack.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </section>

        <section
          style={{
            background: 'rgba(201,168,68,0.1)',
            border: '1px solid rgba(201,168,68,0.35)',
            padding: 20,
            marginBottom: 28,
          }}
        >
          <p
            style={{
              margin: '0 0 8px',
              fontSize: 11,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: '#C9A844',
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            What to show next
          </p>
          <p style={{ margin: 0, lineHeight: 1.6 }}>{pack.talkingPoints}</p>
        </section>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, fontFamily: 'system-ui, sans-serif' }}>
          <a
            href={pack.siteUrl}
            style={{
              background: '#C9A844',
              color: '#0B1220',
              padding: '12px 18px',
              textDecoration: 'none',
              fontWeight: 700,
            }}
          >
            Open sample website
          </a>
          <a
            href={pack.portalLoginUrl}
            style={{
              border: '1px solid rgba(245,241,232,0.35)',
              color: '#F5F1E8',
              padding: '12px 18px',
              textDecoration: 'none',
              fontWeight: 600,
            }}
          >
            Open portal login
          </a>
          <Link href="/" style={{ color: 'rgba(245,241,232,0.55)', alignSelf: 'center' }}>
            Efficiency Architects
          </Link>
        </div>
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: 'rgba(245,241,232,0.06)', padding: '14px 12px' }}>
      <p style={{ margin: 0, fontSize: 11, letterSpacing: '0.08em', textTransform: 'uppercase', opacity: 0.65 }}>
        {label}
      </p>
      <p style={{ margin: '6px 0 0', fontSize: 18, fontWeight: 700 }}>{value}</p>
    </div>
  );
}
