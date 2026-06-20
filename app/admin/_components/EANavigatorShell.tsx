'use client';

import { useState } from 'react';
import UniversalCommandBar from './UniversalCommandBar';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

const NAV_LINKS = [
  { href: '/admin/master', label: 'Master Control' },
  { href: '/admin/resource-radar', label: 'Resource Radar' },
  { href: '/admin/blueprints', label: 'Blueprints' },
  { href: '/admin/dashboard', label: 'Pipeline' },
  { href: '/admin/proposals', label: 'Proposals' },
  { href: '/admin/commissions', label: 'Commissions' },
  { href: '/admin/content-requests', label: 'Content' },
  { href: '/admin/enhancements', label: 'Enhancements' },
];

const NAVIGATOR_GOALS = [
  { label: 'Review revenue & pipeline', href: '/admin/master' },
  { label: 'Manage proposals', href: '/admin/proposals' },
  { label: 'Track partner commissions', href: '/admin/commissions' },
  { label: 'Run Operational MRI funnel', href: '/assessment' },
  { label: 'Analyze a URL (Resource Radar)', action: 'analyze' as const },
  { label: 'View Auto Blueprints', href: '/admin/blueprints' },
  { label: 'Capture an opportunity', action: 'capture' as const },
];

export default function EANavigatorShell({ children }: { children: React.ReactNode }) {
  const [navigatorOpen, setNavigatorOpen] = useState(false);

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
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-xs font-semibold text-blue-200 hover:text-white transition"
              >
                {link.label}
              </a>
            ))}
            <UniversalCommandBar onOpenNavigator={() => setNavigatorOpen(true)} />
            <button
              type="button"
              onClick={() => setNavigatorOpen(true)}
              className="text-xs font-semibold px-3 py-1.5 rounded text-white transition"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              EA Navigator
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
              Pick a path — or press ⌘K to search commands and quick-capture opportunities.
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
                  ) : goal.action === 'analyze' ? (
                    <button
                      type="button"
                      className="w-full text-left text-sm px-3 py-2 rounded border border-neutral-200 hover:border-neutral-400"
                      onClick={() => {
                        setNavigatorOpen(false);
                        window.dispatchEvent(new CustomEvent('ea:open-analyze'));
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
