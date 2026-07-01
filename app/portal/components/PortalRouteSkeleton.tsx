/** Instant Feel skeleton — mirrors Pulse OS portal shell while routes load. */
export function PortalRouteSkeleton() {
  return (
    <div className="ea-app-shell" aria-busy="true" aria-label="Loading portal">
      <aside className="ea-shell-sidebar">
        <div className="pc-skeleton" style={{ height: 52, margin: '16px 12px 24px', borderRadius: 8 }} />
        <div className="pc-skeleton pc-skeleton-line" style={{ margin: '0 12px 10px' }} />
        {['Pulse', 'Simplifi', 'Amplifi', 'Updates', 'Home'].map((label) => (
          <div
            key={label}
            className="pc-skeleton"
            style={{ height: 36, margin: '0 12px 8px', borderRadius: 8 }}
            aria-hidden
          />
        ))}
      </aside>
      <div className="ea-shell-main">
        <header className="ea-shell-topbar">
          <div className="pc-skeleton pc-skeleton-line" style={{ width: '40%', maxWidth: 280 }} />
          <div className="pc-skeleton" style={{ width: 36, height: 36, borderRadius: '50%' }} />
        </header>
        <div className="ea-shell-content">
          <div className="pc-skeleton pc-skeleton-line" style={{ width: '55%', height: 28, marginBottom: 16 }} />
          <div className="pc-skeleton pc-skeleton-line" style={{ width: '72%' }} />
          <div className="pc-skeleton pc-skeleton-card" style={{ marginTop: 24 }} />
          <div className="pc-skeleton pc-skeleton-card" style={{ marginTop: 16, minHeight: 96 }} />
        </div>
      </div>
    </div>
  );
}
