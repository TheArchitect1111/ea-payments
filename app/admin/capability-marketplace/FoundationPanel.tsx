import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';

export type FoundationSlice = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  href: string;
};

export type PackageSyncRow = {
  name: string;
  kind: string;
  vendorPath: string;
  present: boolean;
  vendorVersion: string | null;
  osVersion: string | null;
  versionMatch: boolean | null;
  contentMatch: boolean | null;
  detail: string;
  ok: boolean;
};

export type FoundationStatus = {
  ok: boolean;
  generatedAt: string;
  packages: string[];
  slices: FoundationSlice[];
  packageSync?: {
    ok: boolean;
    osAvailable: boolean;
    packageCount: number;
    presentCount: number;
    missing: string[];
    drifted: string[];
    packages: PackageSyncRow[];
    syncHint: string;
  };
  capabilities: {
    ok: boolean;
    registryCount: number;
    moduleCount: number;
    cprHubMapped?: number;
    unmappedModules: string[];
    cprHubUnmapped?: string[];
  };
  payments: {
    ok: boolean;
    offerCount: number;
    oneTimeCount: number;
    subscriptionCount: number;
    errors: string[];
  };
  cpr: {
    ok: boolean;
    mapped: number;
    unmapped: string[];
    migrationStatus: string;
    cprTenantManifests: number;
    familyHubManifests: number;
  };
  website: { totalSections: number; landingChassis: number; experienceBuilder: number };
  workspaceShellCount: number;
  clientConfigCount: number;
};

export default function FoundationPanel({ status }: { status: FoundationStatus }) {
  const sync = status.packageSync;

  return (
    <div className="space-y-6">
      <div className="bg-white border border-neutral-200 p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest" style={{ color: GOLD }}>
            Foundation status
          </p>
          <h3 className="text-xl font-extrabold mt-1" style={{ color: NAVY }}>
            {status.ok ? 'All foundation slices healthy' : 'Foundation needs attention'}
          </h3>
          <p className="text-xs text-neutral-500 mt-1">
            Generated {new Date(status.generatedAt).toLocaleString()} | CPR migration not started
          </p>
        </div>
        <span
          className={`text-xs font-bold uppercase tracking-wider px-3 py-1.5 rounded ${
            status.ok ? 'bg-green-50 text-green-800' : 'bg-rose-50 text-rose-800'
          }`}
        >
          {status.ok ? 'OK' : 'Issues'}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {status.slices.map((slice) => (
          <article key={slice.id} className="bg-white border border-neutral-200 p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
                  {slice.id}
                </p>
                <h4 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
                  {slice.label}
                </h4>
                <p className="text-sm text-neutral-600 mt-2">{slice.detail}</p>
              </div>
              <span
                className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                  slice.ok ? 'bg-green-50 text-green-800' : 'bg-rose-50 text-rose-800'
                }`}
              >
                {slice.ok ? 'OK' : 'Fail'}
              </span>
            </div>
            <Link
              href={slice.href}
              className="inline-block mt-4 text-xs font-bold uppercase tracking-wider underline"
              style={{ color: NAVY }}
            >
              Open
            </Link>
          </article>
        ))}
      </div>

      {sync && (
        <div className="bg-white border border-neutral-200 p-5 space-y-4">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-neutral-400">
                Vendor package sync
              </p>
              <h4 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
                {sync.ok ? 'Vendor copies healthy' : 'Sync needed'}
              </h4>
              <p className="text-sm text-neutral-600 mt-1">{sync.syncHint}</p>
              <p className="text-xs text-neutral-400 mt-1">
                OS checkout {sync.osAvailable ? 'detected' : 'not available'} ·{' '}
                {sync.presentCount}/{sync.packageCount} present
              </p>
            </div>
            <span
              className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                sync.ok ? 'bg-green-50 text-green-800' : 'bg-amber-50 text-amber-900'
              }`}
            >
              {sync.ok ? 'OK' : 'Drift'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-neutral-200 text-neutral-400 uppercase tracking-wider">
                  <th className="py-2 pr-3 font-semibold">Package</th>
                  <th className="py-2 pr-3 font-semibold">Kind</th>
                  <th className="py-2 pr-3 font-semibold">Vendor</th>
                  <th className="py-2 pr-3 font-semibold">OS</th>
                  <th className="py-2 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {sync.packages.map((row) => (
                  <tr key={row.name} className="border-b border-neutral-100 align-top">
                    <td className="py-2 pr-3 font-mono text-neutral-800">@ea/{row.name}</td>
                    <td className="py-2 pr-3 text-neutral-500">{row.kind}</td>
                    <td className="py-2 pr-3">{row.vendorVersion ?? '—'}</td>
                    <td className="py-2 pr-3">{row.osVersion ?? '—'}</td>
                    <td className="py-2">
                      <span
                        className={`font-bold uppercase ${
                          row.ok ? 'text-green-800' : 'text-rose-700'
                        }`}
                      >
                        {row.ok ? 'OK' : 'Issue'}
                      </span>
                      <p className="text-neutral-500 mt-0.5">{row.detail}</p>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <div className="bg-white border border-neutral-200 p-5">
        <p className="text-xs font-bold uppercase tracking-widest text-neutral-400 mb-3">
          Linked packages
        </p>
        <div className="flex flex-wrap gap-2">
          {status.packages.map((pkg) => (
            <span
              key={pkg}
              className="text-xs font-mono px-2 py-1 rounded bg-neutral-100 text-neutral-700"
            >
              @ea/{pkg}
            </span>
          ))}
        </div>
        <dl className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-5 text-xs text-neutral-600">
          <div>
            <dt className="font-semibold text-neutral-400">Payments</dt>
            <dd>
              {status.payments.oneTimeCount} one-time / {status.payments.subscriptionCount} sub
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-400">CPR hub mapped</dt>
            <dd>
              {status.cpr.mapped} mapped / {status.cpr.unmapped.length} unmapped
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-400">Website sections</dt>
            <dd>{status.website.totalSections}</dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-400">Workspace shells</dt>
            <dd>
              {status.workspaceShellCount} | {status.clientConfigCount} clients
            </dd>
          </div>
        </dl>
        {status.payments.errors.length > 0 && (
          <ul className="mt-4 text-xs text-rose-700 space-y-1">
            {status.payments.errors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
