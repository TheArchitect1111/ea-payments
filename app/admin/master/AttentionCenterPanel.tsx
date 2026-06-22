import type { AttentionItem } from '@/lib/pulse-attention';
import '@/app/components/guided-first-success/guided-first-success.css';

export default function AttentionCenterPanel({ items }: { items: AttentionItem[] }) {
  if (items.length === 0) {
    return (
      <section className="ac-panel" style={{ marginBottom: 0 }}>
        <h2>Attention Center™</h2>
        <p className="ac-sub">What deserves your attention right now?</p>
        <p className="gfs-muted" style={{ margin: 0 }}>
          All clear — no critical items from Pulse ingestion.
        </p>
      </section>
    );
  }

  return (
    <section className="ac-panel" style={{ marginBottom: 0 }}>
      <h2>Attention Center™</h2>
      <p className="ac-sub">Pulse-ranked priorities across EA products</p>
      {items.map((item) => (
        <div key={item.id} className="ac-item">
          <div>
            <span className="ac-priority">{item.priority}</span>
            <strong>{item.title}</strong>
            <span>
              {item.product} — {item.detail}
            </span>
          </div>
          {item.href && item.cta && (
            <a href={item.href} className="ac-cta">
              {item.cta}
            </a>
          )}
        </div>
      ))}
    </section>
  );
}
