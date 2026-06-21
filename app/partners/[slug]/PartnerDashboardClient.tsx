'use client';

export default function PartnerDashboardClient({ slug }: { slug: string }) {
  const assessmentUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/assessment?partner=${encodeURIComponent(slug)}`;

  return (
    <div className="pp-card">
      <h2
        style={{
          margin: '0 0 12px',
          fontSize: 14,
          color: '#6B7280',
          textTransform: 'uppercase',
          letterSpacing: '0.1em',
        }}
      >
        Share with prospects
      </h2>
      <p style={{ color: '#6B7280', fontSize: 14, lineHeight: 1.6 }}>
        Send prospects to the Capacity Assessment. Attribution is tracked in Command Center when they
        convert.
      </p>
      <input
        readOnly
        value={assessmentUrl}
        className="pl-input"
        style={{ marginTop: 12, width: '100%', fontSize: 13 }}
        onFocus={(e) => e.target.select()}
      />
    </div>
  );
}
