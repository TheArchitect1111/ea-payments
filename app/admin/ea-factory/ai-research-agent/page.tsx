import Link from 'next/link';
import { researchAgent } from '@/lib/agents/research-agent';

export const dynamic = 'force-dynamic';

export default async function AIResearchAgentPage() {
  const health = await researchAgent.health();

  return (
    <main style={{
      minHeight: '100vh',
      background: '#070b13',
      color: '#f8fafc',
      padding: '48px 20px',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>
      <section style={{ maxWidth: 920, margin: '0 auto' }}>
        <p style={{
          display: 'inline-flex',
          padding: '7px 11px',
          border: '1px solid rgba(216,173,61,0.28)',
          borderRadius: 999,
          color: '#f6d66b',
          fontSize: 12,
          fontWeight: 900,
          letterSpacing: 0.12,
          textTransform: 'uppercase',
        }}>
          EA Specialist Framework
        </p>
        <h1 style={{ margin: '18px 0 12px', fontSize: 'clamp(38px, 6vw, 72px)', lineHeight: 0.95 }}>
          Research Specialist
        </h1>
        <p style={{ maxWidth: 720, color: 'rgba(248,250,252,0.72)', fontSize: 18, lineHeight: 1.6 }}>
          Orbie can now delegate research-shaped requests to the Research Specialist. The Specialist
          returns an executive summary, findings, risks, opportunities, sources, recommended next
          actions, and a saved memory event.
        </p>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: 12,
          marginTop: 28,
        }}>
          <div style={cardStyle}>
            <span style={labelStyle}>Status</span>
            <strong style={valueStyle}>{health.status}</strong>
            <p style={copyStyle}>{health.details}</p>
          </div>
          <div style={cardStyle}>
            <span style={labelStyle}>Fallback</span>
            <strong style={valueStyle}>enabled</strong>
            <p style={copyStyle}>Anonymous and unconfigured environments use local conservative analysis.</p>
          </div>
          <div style={cardStyle}>
            <span style={labelStyle}>Memory</span>
            <strong style={valueStyle}>Pulse event</strong>
            <p style={copyStyle}>Completed research writes `research.completed` into Pulse and ActivityEvents.</p>
          </div>
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 28 }}>
          <Link href="/api/agents/research" style={buttonStyle}>Open API Status</Link>
          <Link href="/admin/knowledge-graph" style={buttonMutedStyle}>Open Memory Graph</Link>
          <Link href="/admin/resource-radar" style={buttonMutedStyle}>Open Resource Radar</Link>
        </div>
      </section>
    </main>
  );
}

const cardStyle = {
  padding: 18,
  border: '1px solid rgba(255,255,255,0.11)',
  borderRadius: 8,
  background: 'rgba(255,255,255,0.055)',
} as const;

const labelStyle = {
  display: 'block',
  color: '#f6d66b',
  fontSize: 11,
  fontWeight: 900,
  letterSpacing: 0.12,
  textTransform: 'uppercase',
} as const;

const valueStyle = {
  display: 'block',
  marginTop: 8,
  fontSize: 24,
  textTransform: 'capitalize',
} as const;

const copyStyle = {
  margin: '8px 0 0',
  color: 'rgba(248,250,252,0.68)',
  lineHeight: 1.5,
} as const;

const buttonStyle = {
  display: 'inline-flex',
  alignItems: 'center',
  minHeight: 42,
  padding: '0 16px',
  borderRadius: 999,
  background: '#f6d66b',
  color: '#070b13',
  fontWeight: 900,
  textDecoration: 'none',
} as const;

const buttonMutedStyle = {
  ...buttonStyle,
  background: 'rgba(255,255,255,0.08)',
  color: '#f8fafc',
  boxShadow: 'inset 0 0 0 1px rgba(255,255,255,0.12)',
} as const;
