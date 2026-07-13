import { NAVY, GOLD } from '@/lib/design-system';
import Link from 'next/link';

export type FoundationSlice = {
  id: string;
  label: string;
  ok: boolean;
  detail: string;
  href: string;
};

export type FoundationStatus = {
  ok: boolean;
  generatedAt: string;
  packages: string[];
  slices: FoundationSlice[];
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
              {status.cpr.mapped} mapped / unmapped {status.cpr.unmapped.length}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-400">Website sections</dt>
            <dd>{status.website.totalSections}</dd>
          </div>
          <div>
            <dt className="font-semibold text-neutral-400">Workspace shells</dt>
            <dd>
              {status.workspaceShellCount} ? {status.clientConfigCount} clients
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
