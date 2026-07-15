'use client';

import Link from 'next/link';
import { useState } from 'react';
import UniversalCommandBar from './UniversalCommandBar';
import VoiceAssistant from './VoiceAssistant';
import { GOLD, NAVY } from '@/lib/design-system';

const EXPERIMENTAL_ADMIN =
  process.env.NEXT_PUBLIC_EXPERIMENTAL_ADMIN === 'true' ||
  process.env.EXPERIMENTAL_ADMIN === 'true' ||
  process.env.EXPERIMENTAL_ADMIN === '1';

const NAVIGATOR_GOALS = [
  { label: 'Review Revenue & Pipeline', href: '/admin/dashboard' },
  { label: 'Open Organizations', href: '/admin/organizations' },
  { label: 'Review Operations', href: '/admin/operations' },
  { label: 'Open Product Operations', href: '/admin/products' },
  { label: 'Review Decisions', href: '/admin/decisions' },
  { label: 'Track partner commissions', href: '/admin/commissions' },
  { label: 'Run Operational MRI funnel', href: '/assessment' },
  { label: 'Open Simplifi workspace', href: '/admin/simplifi' },
  { label: 'Run Simplifi website audit', href: '/admin/simplifi-audit' },
  { label: 'Review EA protocols', href: '/admin/protocol-center' },
  { label: 'Open EA Factory', href: '/admin/ea-factory' },
  { label: 'Launch EACP workflow', href: '/admin/ea-factory/launches' },
  { label: 'Search approved repositories', href: '/admin/ea-factory/repo-library' },
  { label: 'Generate a project brief', href: '/admin/ea-factory/project-generator' },
  { label: 'Generate a skin brief', href: '/admin/ea-factory/skin-factory' },
  ...(EXPERIMENTAL_ADMIN
    ? [
        { label: 'Search Knowledge Graph', href: '/admin/knowledge-graph' },
        { label: 'Open Atlas', href: '/admin/atlas' },
        { label: 'View Digital Twin', href: '/admin/digital-twin' },
        { label: 'Browse Partner Marketplace', href: '/admin/partner-marketplace' },
        { label: 'Analyze a URL (Resource Radar)', action: 'analyze' as const },
      ]
    : []),
  { label: 'Learn EA Academy', href: '/admin/academy' },
  { label: 'View Auto Blueprints', href: '/admin/blueprints' },
  { label: 'Open Knowledge Center', href: '/admin/knowledge' },
  { label: 'Capture an opportunity', action: 'capture' as const },
];

/**
 * Command bar, voice, and navigator goals — preserved from EANavigatorShell
 * inside TailAdmin admin chrome.
 */
export default function AdminChromeTools() {
  const [navigatorOpen, setNavigatorOpen] = useState(false);

  return (
    <>
      <div className="flex flex-wrap items-center gap-2 justify-end mb-4">
        <UniversalCommandBar onOpenNavigator={() => setNavigatorOpen(true)} />
        <VoiceAssistant />
        <button
          type="button"
          id="ea-navigator-btn"
          onClick={() => setNavigatorOpen(true)}
          className="text-xs font-semibold px-3 py-1.5 rounded transition"
          style={{ backgroundColor: GOLD, color: NAVY }}
        >
          Navigator
        </button>
      </div>

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
                  {'action' in goal && goal.action === 'capture' ? (
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
                  ) : 'action' in goal && goal.action === 'analyze' ? (
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
                    <Link
                      href={'href' in goal && goal.href ? goal.href : '/admin/master'}
                      prefetch={false}
                      className="block text-sm px-3 py-2 rounded border border-neutral-200 hover:border-neutral-400"
                      onClick={() => setNavigatorOpen(false)}
                    >
                      {goal.label} →
                    </Link>
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
    </>
  );
}
