'use client';

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import {
  EA_GUIDE_DAILY_BRIEF_KEY,
  EA_GUIDE_MEMORY_KEY,
  type EAGuideMemoryItem,
  resolveGuideContext,
} from '@/lib/ea-guide';
import './ea-guide.css';

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning.';
  if (hour < 17) return 'Good afternoon.';
  return 'Good evening.';
}

export default function EAGuideOrb() {
  const pathname = usePathname() ?? '/';
  const context = useMemo(() => resolveGuideContext(pathname), [pathname]);
  const [open, setOpen] = useState(false);
  const [voiceOpen, setVoiceOpen] = useState(false);
  const [toast, setToast] = useState('');
  const [memory, setMemory] = useState<EAGuideMemoryItem[]>([]);

  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(EA_GUIDE_MEMORY_KEY);
      setMemory(stored ? JSON.parse(stored) as EAGuideMemoryItem[] : []);
    } catch {
      setMemory([]);
    }
  }, []);

  useEffect(() => {
    const key = `${EA_GUIDE_DAILY_BRIEF_KEY}-${context.id}`;
    const seen = window.localStorage.getItem(key);
    if (seen === todayKey()) return;

    const timer = window.setTimeout(() => {
      setOpen(true);
      window.localStorage.setItem(key, todayKey());
    }, 1400);

    return () => window.clearTimeout(timer);
  }, [context.id]);

  function saveMemory(label: string, detail = context.recommendedAction) {
    const item: EAGuideMemoryItem = {
      id: `${context.id}-${memory.length}-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
      label,
      detail,
      createdAt: new Date().toISOString(),
      contextId: context.id,
    };
    const next = [item, ...memory].slice(0, 12);
    setMemory(next);
    window.localStorage.setItem(EA_GUIDE_MEMORY_KEY, JSON.stringify(next));
    setToast('Guide memory updated.');
    window.setTimeout(() => setToast(''), 2200);
  }

  function runEvent(eventName?: string) {
    if (!eventName) return;
    window.dispatchEvent(new CustomEvent(eventName, { detail: { source: 'ea-guide', context: context.id } }));
    setToast('Guide action sent.');
    window.setTimeout(() => setToast(''), 2200);
  }

  const state = voiceOpen ? 'listening' : open ? 'speaking' : context.state;
  const stacked = pathname.includes('/simplifi/capture') || pathname.includes('/amplifi/share');
  const recentMemory = memory.filter((item) => item.contextId === context.id).slice(0, 2);

  return (
    <>
      <div className={`ea-guide-shell${stacked ? ' ea-guide-shell-stacked' : ''}`}>
        {toast ? <div className="ea-guide-toast">{toast}</div> : null}
        {open ? (
          <section className="ea-guide-card" aria-label="EA Guide recommendations">
            <div className="ea-guide-card-head">
              <div>
                <p className="ea-guide-eyebrow">EA Guide&trade;</p>
                <h2>{timeGreeting()}</h2>
                <p>{context.role} for {context.product}</p>
              </div>
              <button type="button" className="ea-guide-icon-btn" onClick={() => setOpen(false)} aria-label="Close EA Guide">
                x
              </button>
            </div>

            <div className="ea-guide-brief">
              <p className="ea-guide-section-label">Since your last visit</p>
              <ul>
                {context.sinceLastVisit.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="ea-guide-recommendation">
              <p className="ea-guide-section-label">Recommended action</p>
              <strong>{context.recommendedAction}</strong>
              <span>{context.recommendationDetail}</span>
            </div>

            <div className="ea-guide-actions">
              {context.actions.map((action) => {
                if (action.kind === 'href' && action.href) {
                  return (
                    <Link key={action.id} href={action.href} className="ea-guide-action">
                      {action.label}
                    </Link>
                  );
                }
                return (
                  <button
                    key={action.id}
                    type="button"
                    className="ea-guide-action"
                    onClick={() => {
                      if (action.kind === 'event') runEvent(action.eventName);
                      if (action.kind === 'memory') saveMemory(action.label);
                    }}
                  >
                    {action.label}
                  </button>
                );
              })}
              <button type="button" className="ea-guide-action ea-guide-action-muted" onClick={() => setVoiceOpen(true)}>
                Voice Mode
              </button>
            </div>

            <div className="ea-guide-protocols">
              <p className="ea-guide-section-label">Protocol awareness</p>
              <div>
                {context.protocolAwareness.slice(0, 4).map((protocol) => (
                  <span key={protocol}>{protocol.replace(' Protocol', '')}</span>
                ))}
              </div>
            </div>

            {recentMemory.length > 0 ? (
              <div className="ea-guide-memory">
                <p className="ea-guide-section-label">Remembered</p>
                {recentMemory.map((item) => (
                  <p key={item.id}>{item.label}: {item.detail}</p>
                ))}
              </div>
            ) : null}
          </section>
        ) : null}

        <button
          type="button"
          className={`ea-guide-orb ea-guide-orb-${state}`}
          aria-label="Open EA Guide"
          data-state={state}
          onClick={() => setOpen((value) => !value)}
        >
          <span className="ea-guide-ring ea-guide-ring-gold" />
          <span className="ea-guide-ring ea-guide-ring-blue" />
          <span className="ea-guide-core">
            <Image src="/ea-logo.png" alt="" width={34} height={34} priority={false} />
          </span>
          <span className="ea-guide-state">{state}</span>
        </button>
      </div>

      {voiceOpen ? (
        <div className="ea-guide-voice" role="dialog" aria-modal="true" aria-label="EA Guide voice mode">
          <div className="ea-guide-voice-orb">
            <span />
            <span />
            <span />
            <Image src="/ea-logo.png" alt="" width={72} height={72} />
          </div>
          <p className="ea-guide-eyebrow">EA Guide Voice Mode</p>
          <h2>{context.role}</h2>
          <p>{context.recommendedAction}</p>
          <div className="ea-guide-voice-actions">
            <button type="button" onClick={() => saveMemory('Voice note', context.recommendedAction)}>
              Save Note
            </button>
            <button type="button" onClick={() => setVoiceOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </>
  );
}
