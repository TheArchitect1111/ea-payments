'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useEffect, useState } from 'react';
import UniversalCommandBar from './UniversalCommandBar';
import VoiceAssistant from './VoiceAssistant';
import { startGuidedTour } from './GuidedTour';
import {
  BUILDER_NAV,
  EXECUTIVE_NAV,
  readOperatingMode,
  writeOperatingMode,
  type OperatingMode,
} from '@/lib/admin-operating-mode';

const NAVIGATOR_GOALS = [
  { label: 'Launch a communication campaign', href: '/admin/creative-studio' },
  { label: 'Review revenue & pipeline', href: '/admin/master' },
  { label: 'Run client delivery board', href: '/admin/delivery' },
  { label: 'Manage proposals', href: '/admin/proposals' },
  { label: 'Build portal or landing page', href: '/admin/ea-factory/new-experience' },
  { label: 'Open Simplifi workspace', href: '/admin/simplifi' },
  { label: 'Open EA Factory', href: '/admin/ea-factory' },
  { label: 'Generate a skin brief', href: '/admin/ea-factory/skin-factory' },
  { label: 'Capture an opportunity', action: 'capture' as const },
];

export default function EANavigatorShell({ children }: { children: React.ReactNode }) {
  const [navigatorOpen, setNavigatorOpen] = useState(false);
  const [mode, setMode] = useState<OperatingMode>('executive');

  useEffect(() => {
    setMode(readOperatingMode());
    const onMode = (e: Event) => {
      const detail = (e as CustomEvent<OperatingMode>).detail;
      if (detail) setMode(detail);
    };
    window.addEventListener('ea:operating-mode-change', onMode);
    return () => window.removeEventListener('ea:operating-mode-change', onMode);
  }, []);

  const navLinks = mode === 'builder' ? BUILDER_NAV : EXECUTIVE_NAV;

  const setModeAndPersist = (next: OperatingMode) => {
    setMode(next);
    writeOperatingMode(next);
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <header style={{ backgroundColor: NAVY }} className="px-6 py-4">
        <div className="max-w-6xl mx-auto flex items-center justify-between flex-wrap gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
              Efficiency Architects
            </p>
            <h1 className="text-lg font-extrabold uppercase tracking-widest text-white">
              Mission Control
            </h1>
          </div>
          <div className="flex items-center gap-3 flex-wrap">
            <div
              className="flex rounded overflow-hidden border border-blue-400/40"
              role="group"
              aria-label="Operating mode"
            >
              <button
                type="button"
                onClick={() => setModeAndPersist('executive')}
                className="text-xs font-semibold px-2.5 py-1 transition"
                style={{
                  backgroundColor: mode === 'executive' ? GOLD : 'transparent',
                  color: mode === 'executive' ? NAVY : '#bfdbfe',
                }}
              >
                Executive
              </button>
              <button
                type="button"
                onClick={() => setModeAndPersist('builder')}
                className="text-xs font-semibold px-2.5 py-1 transition"
                style={{
                  backgroundColor: mode === 'builder' ? GOLD : 'transparent',
                  color: mode === 'builder' ? NAVY : '#bfdbfe',
                }}
              >
                Builder
              </button>
            </div>
            {navLinks.map((link) => (
              <a
                key={`${mode}-${link.href}-${link.label}`}
                href={link.href}
                className="text-xs font-semibold text-blue-200 hover:text-white transition"
              >
                {link.label}
              </a>
            ))}
            <UniversalCommandBar onOpenNavigator={() => setNavigatorOpen(true)} />
            <VoiceAssistant />
            <button
              type="button"
              id="ea-navigator-btn"
              onClick={() => setNavigatorOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded text-white transition"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              EA Navigator
            </button>
            <button
              type="button"
              onClick={startGuidedTour}
              className="text-xs font-semibold text-blue-200 hover:text-white transition"
            >
              Tour
            </button>
            <a
              href="/api/admin/logout"
              className="text-xs font-semibold text-blue-200 hover:text-white transition"
            >
              Sign Out
            </a>
          </div>
        </div>
      </header>

      {navigatorOpen && (
        <div
          className="fixed inset-0 z-[90] flex items-end justify-end p-6"
          style={{ backgroundColor: 'rgba(15,31,61,0.35)' }}
          onClick={() => setNavigatorOpen(false)}
        >
          <div
            className="w-full max-w-sm bg-white rounded-lg shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
              EA Navigator
            </p>
            <h2 className="text-lg font-bold mb-2" style={{ color: NAVY }}>
              What are you trying to accomplish?
            </h2>
            <p className="text-xs text-neutral-500 mb-4 leading-relaxed">
              Pick a path — or type your intent on Mission Control home.
            </p>
            <ul className="space-y-2">
              {NAVIGATOR_GOALS.map((goal) => (
                <li key={goal.label}>
                  {goal.action === 'capture' ? (
                    <button
                      type="button"
                      className="w-full text-left text-sm px-3 py-2 rounded border border-neutral-200 hover:border-neutral-400"
                      onClick={() => {
                        setNavigatorOpen(false);
                        window.dispatchEvent(new CustomEvent('ea:open-capture'));
                      }}
                    >
                      {goal.label} →
                    </button>
                  ) : (
                    <a
                      href={goal.href}
                      className="block text-sm px-3 py-2 rounded border border-neutral-200 hover:border-neutral-400"
                    >
                      {goal.label} →
                    </a>
                  )}
                </li>
              ))}
            </ul>
            <button
              type="button"
              onClick={() => setNavigatorOpen(false)}
              className="mt-4 text-xs text-neutral-400"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {children}
    </div>
  );
}
