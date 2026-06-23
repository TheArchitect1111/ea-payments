'use client';

import Link from 'next/link';
import { useState } from 'react';
import type { EACPLaunchRecord } from '@/lib/eacp-launch';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

const DEFAULT_COMMAND = 'EACP Client: Bob Rumball Centre Goal: Training Transformation Deliverable: Website + Portal + Learning Hub Notes: Convert videos, SOPs, policies, and PowerPoints into modular learning.';

export default function LaunchesClient({ initialLaunches }: { initialLaunches: EACPLaunchRecord[] }) {
  const [launches, setLaunches] = useState(initialLaunches);
  const [command, setCommand] = useState(DEFAULT_COMMAND);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  async function launchEACP() {
    setPending(true);
    setError('');

    try {
      const response = await fetch('/api/ea-factory/launch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
      });
      const payload = await response.json();

      if (!response.ok) {
        setError(payload.correction ?? payload.error ?? 'Launch failed.');
        return;
      }

      const launch = payload.launch as EACPLaunchRecord;
      setLaunches((current) => [launch, ...current.filter((item) => item.id !== launch.id)]);
      window.dispatchEvent(new CustomEvent('ea-guide:launch-ready'));
    } catch {
      setError('Launch failed. Check the EACP command and try again.');
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="border border-neutral-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
              EACP Command
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight" style={{ color: NAVY }}>
              Launch Engine
            </h2>
          </div>
          <button
            type="button"
            onClick={launchEACP}
            disabled={pending}
            className="bg-[#C9A844] px-5 py-3 text-xs font-black uppercase tracking-wider text-[#1B2B4D] disabled:opacity-50"
          >
            {pending ? 'Launching...' : 'Launch Workflow'}
          </button>
        </div>
        <textarea
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          className="mt-5 h-48 w-full border border-neutral-200 bg-[#FAF8F3] p-4 text-sm leading-6 outline-none"
          aria-label="EACP launch command"
        />
        {error ? <p className="mt-3 text-sm font-semibold text-red-700">{error}</p> : null}
      </section>

      <section>
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: GOLD }}>
              Launch Records
            </p>
            <h2 className="mt-2 text-2xl font-black tracking-tight" style={{ color: NAVY }}>
              Approval Queue
            </h2>
          </div>
          <Link href="/admin/ea-factory/approvals" className="text-sm font-bold" style={{ color: NAVY }}>
            Continue To Approval
          </Link>
        </div>

        {launches.length === 0 ? (
          <div className="border border-dashed border-neutral-300 bg-white p-8 text-sm text-neutral-500">
            No EACP launches have been created in this runtime session.
          </div>
        ) : (
          <div className="overflow-hidden border border-neutral-200 bg-white shadow-sm">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="bg-[#FAF8F3] text-xs uppercase tracking-wider text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Client</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Brief Links</th>
                  <th className="px-4 py-3">Repo Recommendations</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                {launches.map((launch) => (
                  <tr key={launch.id}>
                    <td className="px-4 py-4 align-top">
                      <Link href={launch.links.reviewPackage} className="font-black hover:underline" style={{ color: NAVY }}>
                        {launch.client}
                      </Link>
                      <p className="mt-1 text-xs text-neutral-500">{launch.goal}</p>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <span className="rounded-full bg-[#FAF8F3] px-3 py-1 text-xs font-bold uppercase tracking-wider text-neutral-600">
                        {launch.status.replaceAll('-', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-4 align-top text-neutral-600">{new Date(launch.timestamp).toLocaleString()}</td>
                    <td className="px-4 py-4 align-top">
                      <div className="flex flex-wrap gap-2">
                        <Link href={launch.links.reviewPackage} className="text-xs font-bold" style={{ color: NAVY }}>Review Package</Link>
                        <Link href={launch.links.projectBrief} className="text-xs font-bold" style={{ color: NAVY }}>Project Brief</Link>
                        <Link href={launch.links.skinBrief} className="text-xs font-bold" style={{ color: NAVY }}>Skin Brief</Link>
                      </div>
                    </td>
                    <td className="px-4 py-4 align-top">
                      <div className="space-y-1">
                        {launch.recommendedRepos.slice(0, 3).map((repo) => (
                          <p key={repo.id} className="text-xs text-neutral-600">
                            <strong>{repo.compatibilityScore}</strong> {repo.name}
                          </p>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
