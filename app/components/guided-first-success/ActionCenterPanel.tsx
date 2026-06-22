import Link from 'next/link';
import type { ActionCenterItem } from '@/lib/guided-first-success';
import './guided-first-success.css';

export default function ActionCenterPanel({ items }: { items: ActionCenterItem[] }) {
  if (items.length === 0) return null;

  return (
    <section className="ac-panel" aria-labelledby="action-center-title">
      <h2 id="action-center-title">Action Center™</h2>
      <p className="ac-sub">What deserves your attention right now?</p>
      {items.map((item) => (
        <div key={item.id} className="ac-item">
          <div>
            <span className="ac-priority">{item.priority}</span>
            <strong>{item.title}</strong>
            <span>{item.detail}</span>
          </div>
          {item.href && item.cta && (
            <Link href={item.href} className="ac-cta">
              {item.cta}
            </Link>
          )}
        </div>
      ))}
    </section>
  );
}
