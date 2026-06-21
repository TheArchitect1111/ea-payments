'use client';

/** Apple-style Pulse™ mission control — first technology visual on the homepage. */
export default function PulseDashboardShowcase() {
  const metrics = [
    { label: 'Organizational Health', value: 'Strong', trend: '+12%' },
    { label: 'Communication Activity', value: '847', trend: 'Active' },
    { label: 'Engagement', value: '94%', trend: '+8%' },
    { label: 'Opportunities', value: '23', trend: 'New' },
    { label: 'Needs Attention', value: '3', trend: 'Low' },
  ];

  return (
    <div className="ea-pulse-stage" aria-label="Pulse mission control preview">
      <div className="ea-pulse-glow" aria-hidden="true" />
      <div className="ea-pulse-dashboard">
        <header className="ea-pulse-header">
          <span className="ea-pulse-mark">Pulse™</span>
          <span className="ea-pulse-status">Live overview</span>
        </header>
        <div className="ea-pulse-metrics">
          {metrics.map((m) => (
            <div key={m.label} className="ea-pulse-metric">
              <span className="ea-pulse-metric-label">{m.label}</span>
              <strong className="ea-pulse-metric-value">{m.value}</strong>
              <span className="ea-pulse-metric-trend">{m.trend}</span>
            </div>
          ))}
        </div>
        <div className="ea-pulse-bar" aria-hidden="true">
          <span style={{ width: '78%' }} />
        </div>
        <p className="ea-pulse-caption">One calm view of what matters — without chasing information.</p>
      </div>
    </div>
  );
}
