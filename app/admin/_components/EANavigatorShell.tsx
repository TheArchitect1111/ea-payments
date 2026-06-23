'use client';

import { useState } from 'react';
import UniversalCommandBar from './UniversalCommandBar';
import VoiceAssistant from './VoiceAssistant';
import { startGuidedTour } from './GuidedTour';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

const EXPERIMENTAL_ADMIN =
  process.env.EXPERIMENTAL_ADMIN === 'true' || process.env.EXPERIMENTAL_ADMIN === '1';

const CORE_NAV_LINKS = [
  { href: '/admin/master', label: 'Master Control' },
  { href: '/admin/simplifi', label: 'Simplifi' },
  { href: '/admin/simplifi-audit', label: 'Simplifi Audit' },
  { href: '/admin/blueprints', label: 'Blueprints' },
  { href: '/admin/protocol-center', label: 'Protocol Center' },
  { href: '/admin/ea-factory', label: 'EA Factory' },
  { href: '/admin/ea-factory/repo-library', label: 'Repo Library' },
  { href: '/admin/ea-factory/project-generator', label: 'Project Generator' },
  { href: '/admin/ea-factory/skin-factory', label: 'Skin Factory' },
  { href: '/admin/foundation-library', label: 'Foundation Library' },
  { href: '/admin/academy', label: 'Academy' },
  { href: '/admin/delivery', label: 'Delivery' },
  { href: '/admin/dashboard', label: 'Pipeline' },
  { href: '/admin/proposals', label: 'Proposals' },
  { href: '/admin/commissions', label: 'Commissions' },
  { href: '/admin/content-requests', label: 'Content' },
  { href: '/admin/enhancements', label: 'Enhancements' },
];

const EXPERIMENTAL_NAV_LINKS = [
  { href: '/admin/resource-radar', label: 'Resource Radar' },
  { href: '/admin/knowledge-graph', label: 'Knowledge Graph' },
  { href: '/admin/digital-twin', label: 'Digital Twin' },
  { href: '/admin/partner-marketplace', label: 'Marketplace' },
];

const NAV_LINKS = EXPERIMENTAL_ADMIN
  ? [...CORE_NAV_LINKS.slice(0, 2), ...EXPERIMENTAL_NAV_LINKS, ...CORE_NAV_LINKS.slice(2)]
  : CORE_NAV_LINKS;

const NAVIGATOR_GOALS = [
  { label: 'Review revenue & pipeline', href: '/admin/master' },
  { label: 'Run client delivery board', href: '/admin/delivery' },
  { label: 'Manage proposals', href: '/admin/proposals' },
  { label: 'Track partner commissions', href: '/admin/commissions' },
  { label: 'Run Operational MRI funnel', href: '/assessment' },
  { label: 'Open Simplifi workspace', href: '/admin/simplifi' },
  { label: 'Run Simplifi website audit', href: '/admin/simplifi-audit' },
  { label: 'Review EA protocols', href: '/admin/protocol-center' },
  { label: 'Open EA Factory', href: '/admin/ea-factory' },
  { label: 'Search approved repositories', href: '/admin/ea-factory/repo-library' },
  { label: 'Generate a project brief', href: '/admin/ea-factory/project-generator' },
  { label: 'Generate a skin brief', href: '/admin/ea-factory/skin-factory' },
  ...(EXPERIMENTAL_ADMIN
    ? [
        { label: 'Search Knowledge Graph', href: '/admin/knowledge-graph' },
        { label: 'View Digital Twin', href: '/admin/digital-twin' },
        { label: 'Browse Partner Marketplace', href: '/admin/partner-marketplace' },
        { label: 'Analyze a URL (Resource Radar)', action: 'analyze' as const },
      ]
    : []),
  { label: 'Learn EA Academy', href: '/admin/academy' },
  { label: 'View Auto Blueprints', href: '/admin/blueprints' },
  { label: 'Open Foundation Library', href: '/admin/foundation-library' },
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
