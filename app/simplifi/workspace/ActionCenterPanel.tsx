'use client';

import Link from 'next/link';
import type { ActionCenterPayload } from '@/lib/action-center';
import './action-center-panel.css';

export default function ActionCenterPanel({ center }: { center: ActionCenterPayload }) {
  const hasContent =
    center.needsAttention.length > 0 ||
    center.recommended.length > 0 ||
    center.watchlist.length > 0;

  if (!hasContent) return null;

  return (
    <section className="ac-panel">
      <h2>Action Center</h2>
      <p className="ac-lead">What deserves your attention right now.</p>

      {center.needsAttention.length > 0 && (
        <div className="ac-block">
          <h3>Needs Attention</h3>
          <ul>
            {center.needsAttention.map((item) => (
              <li key={item.id} className={`ac-item ac-${item.priority}`}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                {item.href && (
                  <Link href={item.href} className="ac-link">
                    Act
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {center.recommended.length > 0 && (
        <div className="ac-block">
          <h3>Recommended Actions</h3>
          <ul>
            {center.recommended.map((item) => (
              <li key={item.id} className={`ac-item ac-${item.priority}`}>
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                {item.href && (
                  <Link href={item.href} className="ac-link">
                    Go
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {center.watchlist.length > 0 && (
        <div className="ac-block">
          <h3>Watchlist</h3>
          <ul>
            {center.watchlist.map((item) => (
              <li key={item.id} className="ac-item ac-medium">
                <div>
                  <strong>{item.title}</strong>
                  <p>{item.detail}</p>
                </div>
                {item.href && (
                  <Link href={item.href} className="ac-link">
                    View
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}
