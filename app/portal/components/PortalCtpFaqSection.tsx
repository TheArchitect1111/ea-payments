'use client';

import { useEffect, useId } from 'react';
import { CTP_FAQ_ITEMS } from '@/lib/ctp-faq';
import { CX_EMOTION } from '@/lib/ctp-emotional-copy';

/**
 * In-page FAQ for Help — reuses CTP_FAQ_ITEMS. Not a floating control;
 * EA Assistant remains the only float on Client Experience routes.
 */
export default function PortalCtpFaqSection() {
  const titleId = useId();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (window.location.hash !== '#faq') return;
    const el = document.getElementById('faq');
    if (!el) return;
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    el.focus({ preventScroll: true });
  }, []);

  return (
    <section
      id="faq"
      className="cex-concierge-panel cex-help-faq"
      aria-labelledby={titleId}
      tabIndex={-1}
    >
      <p className="cex-concierge-kicker">{CX_EMOTION.help.drawerKicker}</p>
      <h2 id={titleId} className="cex-concierge-title">
        {CX_EMOTION.help.drawerTitle}
      </h2>
      <p className="cex-concierge-body">{CX_EMOTION.help.drawerIntro}</p>
      <div className="cex-help-drawer-list">
        {CTP_FAQ_ITEMS.map((item) => (
          <details key={item.id} className="cex-help-drawer-item">
            <summary>{item.question}</summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </section>
  );
}
