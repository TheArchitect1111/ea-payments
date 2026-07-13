'use client';

import { NAVY, GOLD } from '@/lib/design-system';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import EntitlementsPanel from './EntitlementsPanel';
import OrgWorkspacePanel from './OrgWorkspacePanel';
import PaymentsPanel, { type PaymentOfferRow, type PaymentsHealth } from './PaymentsPanel';
import CprReadinessPanel, { type CprReadinessView } from './CprReadinessPanel';
import FoundationPanel, { type FoundationStatus } from './FoundationPanel';

type MarketplaceEntry = {
  id: string;
  name: string;
  status: string;
  version: string;
  category: string;
  consumers: string[];
  dependencies: string[];
  certified: boolean;
  documentation?: string;
};

type CatalogEntry = MarketplaceEntry & {
  moduleId: string | null;
  enableKey: string | null;
  reusable: boolean;
  recommendedPriority: string | null;
  description: string;
  purpose: string;
  riskLevel: string | null;
  extractionEffort: string | null;
};

type Health = {
  ok: boolean;
  idMapErrors: string[];
  seedCount: number;
  adaptedCount: number;
  registryCount: number;
  moduleCount: number;
  experienceCapabilityCount: number;
  unmappedModules: string[];
  cprHubMapped?: number;
  cprHubUnmapped?: string[];
};

type ClientRow = {
  id: string;
  organizationId: string;
  name: string;
  workspaceName: string;
  personalityId: string;
  themeId: string;
  enabledModuleKeys: string[];
  plannedModuleKeys: string[];
  capabilityIds: string[];
  plannedCapabilityIds: string[];
  personalityName: string;
  themeName: string;
  missingCapabilityIds: string[];
  navCount: number;
  widgetCount: number;
};

type WebsiteSectionRow = {
  id: string;
  kind: string;
  name: string;
  description: string;
  source: string;
  landingKey: string | null;
  blockId: string | null;
  category: string | null;
};

type WebsiteSummary = {
  totalSections: number;
  landingChassis: number;
  experienceBuilder: number;
  kinds: string[];
};

type WebsiteDemo = {
  pageId: string;
  pageName: string;
  missingSectionIds: string[];
  sections: Array<{
    sectionId: string;
    kind: string;
    order: number;
    name: string;
    source: string;
  }>;
};

type OrgPreset = { id: string; label: string; organizationId: string };

type WorkspaceSummary = {
  id: string;
  organizationId: string;
  name: string;
  workspaceName: string;
  themeId: string;
  personalityId: string;
  terminologyHome: string;
  enabledCapabilityCount: number;
  missingCapabilityCount: number;
  navCount: number;
  widgetCount: number;
  sectionOrder: string[];
  primaryActions: string[];
};

const STATUS_COLORS: Record<string, string> = {
  Certified: 'bg-green-50 text-green-800',
  Development: 'bg-amber-50 text-amber-900',
  Testing: 'bg-sky-50 text-sky-900',
  Planning: 'bg-neutral-100 text-neutral-700',
  Deprecated: 'bg-rose-50 text-rose-800',
};

export default function CapabilityMarketplaceClient({
  marketplace,
  catalog,
  health,
  clients,
  websiteSummary,
  websiteSections,
  websiteDemo,
  orgPresets,
  workspaceSummaries,
  paymentsHealth,
  paymentOffers,
  cprReadiness,
  foundationStatus,
}: {
  marketplace: MarketplaceEntry[];
  catalog: CatalogEntry[];
  health: Health;
  clients: ClientRow[];
  websiteSummary: WebsiteSummary;
  websiteSections: WebsiteSectionRow[];
  websiteDemo: WebsiteDemo;
  orgPresets: OrgPreset[];
  workspaceSummaries: WorkspaceSummary[];
  paymentsHealth: PaymentsHealth;
  paymentOffers: PaymentOfferRow[];
  cprReadiness: CprReadinessView;
  foundationStatus: FoundationStatus;
}) {
  type TabId =
    | 'foundation'
    | 'capabilities'
    | 'clients'
    | 'website'
    | 'entitlements'
    | 'workspace'
    | 'org-workspace'
    | 'payments'
    | 'cpr-readiness';
  const [tab, setTab] = useState<TabId>('foundation');

  useEffect(() => {
    const raw = new URLSearchParams(window.location.search).get('tab');
    const allowed: TabId[] = [
      'foundation',
      'capabilities',
      'clients',
      'website',
      'entitlements',
      'workspace',
      'org-workspace',
      'payments',
      'cpr-readiness',
    ];
    if (raw && (allowed as string[]).includes(raw)) setTab(raw as TabId);
  }, []);
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [query, setQuery] = useState('');
  const [certifiedOnly, setCertifiedOnly] = useState(false);
  const [websiteSource, setWebsiteSource] = useState('');
  const [websiteKind, setWebsiteKind] = useState('');
  const [websiteQuery, setWebsiteQuery] = useState('');

  const categories = useMemo(
    () => [...new Set(catalog.map((c) => c.category))].sort(),
    [catalog],
  );
  const statuses = useMemo(
    () => [...new Set(catalog.map((c) => c.status))].sort(),
    [catalog],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((c) => {
      if (category && c.category !== category) return false;
      if (status && c.status !== status) return false;
      if (certifiedOnly && !c.certified) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.id.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.consumers.some((x) => x.toLowerCase().includes(q)) ||
        (c.moduleId ?? '').toLowerCase().includes(q) ||
        (c.enableKey ?? '').toLowerCase().includes(q)
      );
    });
  }, [catalog, category, status, query, certifiedOnly]);

  const filteredWebsite = useMemo(() => {
    const q = websiteQuery.trim().toLowerCase();
    return websiteSections.filter((section) => {
      if (websiteSource && section.source !== websiteSource) return false;
      if (websiteKind && section.kind !== websiteKind) return false;
      if (!q) return true;
      return (
        section.name.toLowerCase().includes(q) ||
        section.id.toLowerCase().includes(q) ||
        section.description.toLowerCase().includes(q) ||
        (section.blockId ?? '').toLowerCase().includes(q) ||
        (section.landingKey ?? '').toLowerCase().includes(q)
      );
    });
  }, [websiteSections, websiteSource, websiteKind, websiteQuery]);

  return (
    <div className="max-w-6xl mx-auto px-6 py-8 space-y-8">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: GOLD }}>
            Capability Marketplace
          </p>
          <h2 className="text-2xl font-extrabold" style={{ color: NAVY }}>
            What the EA Platform can do
          </h2>
          <p className="text-sm text-neutral-500 mt-2 max-w-2xl">
            Internal registry of reusable capabilities, client enable-lists, and assembly health.
            Not customer-facing.
          </p>
        </div>
        <Link
          href="/admin/master"
          className="text-xs font-bold uppercase tracking-wider border border-neutral-200 bg-white px-3 py-2"
        >
          Mission Control
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Stat
          label="Registry"
          value={String(health.registryCount)}
          hint={`${health.seedCount} seed / ${health.adaptedCount} live`}
        />
        <Stat
          label="Portal modules"
          value={String(health.moduleCount)}
          hint={`${health.experienceCapabilityCount} experience rows`}
        />
        <Stat
          label="CPR hub map"
          value={String(health.cprHubMapped ?? 0)}
          hint={
            health.cprHubUnmapped?.length
              ? `${health.cprHubUnmapped.length} unmapped`
              : 'All hub modules mapped'
          }
        />
        <Stat
          label="Health"
          value={health.ok ? 'OK' : 'Issues'}
          hint={
            health.unmappedModules.length
              ? `${health.unmappedModules.length} unmapped`
              : 'All modules mapped'
          }
        />
        <Stat label="Clients" value={String(clients.length)} hint="Config envelopes" />
      </div>

      <div className="flex gap-2 border-b border-neutral-200 flex-wrap">
        <TabButton active={tab === 'foundation'} onClick={() => setTab('foundation')}>
          Foundation
        </TabButton>
        <TabButton active={tab === 'capabilities'} onClick={() => setTab('capabilities')}>
          Capabilities
        </TabButton>
        <TabButton active={tab === 'clients'} onClick={() => setTab('clients')}>
          Client configs
        </TabButton>
        <TabButton active={tab === 'website'} onClick={() => setTab('website')}>
          Website
        </TabButton>
        <TabButton active={tab === 'entitlements'} onClick={() => setTab('entitlements')}>
          Entitlements
        </TabButton>
        <TabButton active={tab === 'workspace'} onClick={() => setTab('workspace')}>
          Workspace
        </TabButton>
        <TabButton active={tab === 'org-workspace'} onClick={() => setTab('org-workspace')}>
          Org workspace
        </TabButton>
        <TabButton active={tab === 'payments'} onClick={() => setTab('payments')}>
          Payments
        </TabButton>
        <TabButton active={tab === 'cpr-readiness'} onClick={() => setTab('cpr-readiness')}>
          CPR readiness
        </TabButton>
      </div>

      {tab === 'foundation' && <FoundationPanel status={foundationStatus} />}

      {tab === 'capabilities' && (
        <>
          <div className="flex flex-wrap gap-3 items-end">
            <FilterField label="Category">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">All</option>
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Status">
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">All</option>
                {statuses.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Search">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="documents, CPR, billing..."
                className="border border-neutral-200 rounded px-3 py-2 text-sm min-w-[220px]"
              />
            </FilterField>
            <label className="flex items-center gap-2 text-sm text-neutral-600 pb-2">
              <input
                type="checkbox"
                checked={certifiedOnly}
                onChange={(e) => setCertifiedOnly(e.target.checked)}
              />
              Certified only
            </label>
          </div>

          <p className="text-xs text-neutral-400">
            {filtered.length} of {catalog.length} capabilities · marketplace rows {marketplace.length}
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filtered.map((cap) => (
              <CapabilityCard key={cap.id} cap={cap} />
            ))}
          </div>
          {filtered.length === 0 && (
            <p className="text-center text-neutral-400 text-sm py-12">
              No capabilities match your filters.
            </p>
          )}
        </>
      )}

      {tab === 'clients' && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3 border border-neutral-200 bg-white p-4">
            <div>
              <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                Reproduce
              </p>
              <p className="text-sm text-neutral-600 mt-1">
                Spin up an org + workspace + hub entitlements from any preset below.
              </p>
            </div>
            <Link
              href="/admin/ea-factory/client-factory"
              className="rounded-full px-4 py-2 text-xs font-black uppercase tracking-wider text-white"
              style={{ backgroundColor: NAVY }}
            >
              New Client Factory
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {clients.map((client) => (
              <ClientCard key={client.id} client={client} />
            ))}
          </div>
        </div>
      )}

      {tab === 'entitlements' && <EntitlementsPanel orgPresets={orgPresets} />}

      {tab === 'org-workspace' && <OrgWorkspacePanel orgPresets={orgPresets} />}

      {tab === 'payments' && <PaymentsPanel health={paymentsHealth} offers={paymentOffers} />}

      {tab === 'cpr-readiness' && <CprReadinessPanel readiness={cprReadiness} />}

      {tab === 'workspace' && (
        <div className="space-y-4">
          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              Workspace Engine
            </p>
            <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
              Assembled shells from configuration
            </h3>
            <p className="text-sm text-neutral-500 mt-1">
              Theme + personality + enabled capabilities ? no client domain hard-coding in the shell.
            </p>
            <p className="text-xs text-neutral-500 mt-3 leading-relaxed">
              Live portal override order: Organizations Airtable fields
              (<code>Platform Client Id</code>, <code>Theme Id</code>, <code>Personality Id</code>,{' '}
              <code>Workspace Name</code>, <code>Logo</code>, <code>Brand Colors</code>) ? slug heuristics ? EA default.
              Admin API: <code>/api/admin/organization-workspace</code>.
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4">
            {workspaceSummaries.map((ws) => (
              <article key={ws.id} className="bg-white border border-neutral-200 p-5">
                <div className="flex flex-wrap justify-between gap-3">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
                      {ws.id}
                    </p>
                    <h3 className="text-lg font-bold" style={{ color: NAVY }}>
                      {ws.workspaceName}
                    </h3>
                    <p className="text-sm text-neutral-500">{ws.name}</p>
                  </div>
                  <div className="text-right text-xs text-neutral-500">
                    <p>Theme: <strong>{ws.themeId}</strong></p>
                    <p>Personality: <strong>{ws.personalityId}</strong></p>
                    <p>Home label: <strong>{ws.terminologyHome}</strong></p>
                  </div>
                </div>
                <div className="mt-4 grid md:grid-cols-4 gap-3 text-xs">
                  <div className="border border-neutral-100 p-3">
                    <p className="text-neutral-400 font-semibold">Capabilities</p>
                    <p className="text-lg font-extrabold" style={{ color: NAVY }}>{ws.enabledCapabilityCount}</p>
                  </div>
                  <div className="border border-neutral-100 p-3">
                    <p className="text-neutral-400 font-semibold">Nav items</p>
                    <p className="text-lg font-extrabold" style={{ color: NAVY }}>{ws.navCount}</p>
                  </div>
                  <div className="border border-neutral-100 p-3">
                    <p className="text-neutral-400 font-semibold">Widgets</p>
                    <p className="text-lg font-extrabold" style={{ color: NAVY }}>{ws.widgetCount}</p>
                  </div>
                  <div className="border border-neutral-100 p-3">
                    <p className="text-neutral-400 font-semibold">Missing</p>
                    <p className="text-lg font-extrabold" style={{ color: NAVY }}>{ws.missingCapabilityCount}</p>
                  </div>
                </div>
                <div className="mt-4 text-xs text-neutral-600">
                  <p className="font-semibold text-neutral-400 mb-1">Section order</p>
                  <p>{ws.sectionOrder.join(' ? ')}</p>
                  <p className="font-semibold text-neutral-400 mt-3 mb-1">Primary actions</p>
                  <p>{ws.primaryActions.join(' ? ')}</p>
                </div>
                <div className="mt-4">
                  <div className="flex flex-wrap gap-4">
                    <Link
                      href={"/admin/workspace-preview?client=" + encodeURIComponent(ws.id)}
                      className="text-xs font-bold uppercase tracking-wider underline"
                      style={{ color: NAVY }}
                    >
                      Open live preview
                    </Link>
                    <Link
                      href={"/api/platform/workspace?client=" + encodeURIComponent(ws.id)}
                      className="text-xs font-bold uppercase tracking-wider underline"
                      style={{ color: NAVY }}
                    >
                      View shell JSON
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      )}

      {tab === 'website' && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Stat label="Sections" value={String(websiteSummary.totalSections)} hint="Unified registry" />
            <Stat label="Landing chassis" value={String(websiteSummary.landingChassis)} hint="Config sections" />
            <Stat label="Experience builder" value={String(websiteSummary.experienceBuilder)} hint="Puck blocks" />
            <Stat label="Kinds" value={String(websiteSummary.kinds.length)} hint={websiteSummary.kinds.slice(0, 4).join(', ')} />
          </div>

          <div className="bg-white border border-neutral-200 p-5">
            <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
              ClientConfig assembly
            </p>
            <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
              {websiteDemo.pageName}
            </h3>
            <p className="text-xs text-neutral-500 mt-1 font-mono">{websiteDemo.pageId}</p>
            <ol className="mt-4 space-y-1 text-sm text-neutral-700">
              {websiteDemo.sections.map((section) => (
                <li key={section.sectionId}>
                  <span className="font-mono text-xs text-neutral-400 mr-2">{section.order}</span>
                  {section.name}
                  <span className="text-xs text-neutral-400"> · {section.kind} · {section.source}</span>
                </li>
              ))}
            </ol>
            {websiteDemo.missingSectionIds.length > 0 && (
              <p className="mt-3 text-xs text-rose-700">
                Missing: {websiteDemo.missingSectionIds.join(', ')}
              </p>
            )}
            <div className="mt-4 flex flex-wrap gap-4">
              <Link
                href="/admin/reproduce-preview?client=ea"
                className="text-xs font-bold uppercase tracking-wider underline"
                style={{ color: NAVY }}
              >
                Open reproduce preview
              </Link>
              <Link
                href="/site/ea"
                className="text-xs font-bold uppercase tracking-wider underline"
                style={{ color: NAVY }}
              >
                Public site
              </Link>
              <Link
                href="/api/platform/website?view=client&client=ea"
                className="text-xs font-bold uppercase tracking-wider underline"
                style={{ color: NAVY }}
              >
                View client JSON
              </Link>
            </div>
          </div>

          <div className="flex flex-wrap gap-3 items-end">
            <FilterField label="Source">
              <select
                value={websiteSource}
                onChange={(e) => setWebsiteSource(e.target.value)}
                className="border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">All</option>
                <option value="landing-chassis">landing-chassis</option>
                <option value="experience-builder">experience-builder</option>
              </select>
            </FilterField>
            <FilterField label="Kind">
              <select
                value={websiteKind}
                onChange={(e) => setWebsiteKind(e.target.value)}
                className="border border-neutral-200 rounded px-3 py-2 text-sm bg-white"
              >
                <option value="">All</option>
                {websiteSummary.kinds.map((kind) => (
                  <option key={kind} value={kind}>
                    {kind}
                  </option>
                ))}
              </select>
            </FilterField>
            <FilterField label="Search">
              <input
                value={websiteQuery}
                onChange={(e) => setWebsiteQuery(e.target.value)}
                placeholder="hero, FAQ, EAHero..."
                className="border border-neutral-200 rounded px-3 py-2 text-sm min-w-[220px]"
              />
            </FilterField>
          </div>

          <p className="text-xs text-neutral-400">
            {filteredWebsite.length} of {websiteSections.length} website sections
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredWebsite.map((section) => (
              <WebsiteSectionCard key={section.id} section={section} />
            ))}
          </div>
          {filteredWebsite.length === 0 && (
            <p className="text-center text-neutral-400 text-sm py-12">
              No website sections match your filters.
            </p>
          )}
        </>
      )}
    </div>
  );
}
function Stat({ label, value, hint }: { label: string; value: string; hint: string }) {
  return (
    <div className="bg-white border border-neutral-200 p-4">
      <p className="text-[11px] font-bold uppercase tracking-widest text-neutral-400">{label}</p>
      <p className="text-xl font-extrabold mt-1" style={{ color: NAVY }}>
        {value}
      </p>
      <p className="text-xs text-neutral-500 mt-1">{hint}</p>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-xs font-bold uppercase tracking-wider border-b-2 -mb-px ${
        active ? 'border-current' : 'border-transparent text-neutral-400'
      }`}
      style={active ? { color: NAVY } : undefined}
    >
      {children}
    </button>
  );
}

function FilterField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold text-neutral-500 mb-1">{label}</label>
      {children}
    </div>
  );
}

function CapabilityCard({ cap }: { cap: CatalogEntry }) {
  return (
    <article className="bg-white border border-neutral-200 p-5 flex flex-col gap-3">
      <div className="flex justify-between gap-3 items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {cap.category} · v{cap.version}
          </p>
          <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
            {cap.name}
          </h3>
          <p className="text-xs font-mono text-neutral-400 mt-1">{cap.id}</p>
        </div>
        <div className="flex flex-col items-end gap-1">
          <span
            className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
              STATUS_COLORS[cap.status] ?? 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {cap.status}
          </span>
          {cap.certified && (
            <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-green-50 text-green-800">
              Certified
            </span>
          )}
        </div>
      </div>
      <p className="text-sm text-neutral-600">{cap.description}</p>
      <dl className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
        <div>
          <dt className="font-semibold text-neutral-400">Module</dt>
          <dd className="font-mono">{cap.moduleId ?? '-'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-400">Enable key</dt>
          <dd className="font-mono">{cap.enableKey ?? '-'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-400">Priority</dt>
          <dd>{cap.recommendedPriority ?? '-'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-400">Risk / effort</dt>
          <dd>
            {cap.riskLevel ?? '-'} / {cap.extractionEffort ?? '-'}
          </dd>
        </div>
      </dl>
      <div className="text-xs">
        <p className="font-semibold text-neutral-400 mb-1">Consumers</p>
        <p>{cap.consumers.length ? cap.consumers.join(', ') : 'None yet'}</p>
      </div>
      {cap.dependencies.length > 0 && (
        <div className="text-xs">
          <p className="font-semibold text-neutral-400 mb-1">Dependencies</p>
          <p className="font-mono text-neutral-600">{cap.dependencies.join(', ')}</p>
        </div>
      )}
    </article>
  );
}

function ClientCard({ client }: { client: ClientRow }) {
  return (
    <article className="bg-white border border-neutral-200 p-5">
      <div className="flex flex-wrap justify-between gap-3">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: GOLD }}>
            {client.id}
          </p>
          <h3 className="text-lg font-bold" style={{ color: NAVY }}>
            {client.name}
          </h3>
          <p className="text-sm text-neutral-500">{client.workspaceName}</p>
        </div>
        <div className="text-right text-xs text-neutral-500">
          <p>
            Personality: <strong>{client.personalityName}</strong>
          </p>
          <p>
            Theme: <strong>{client.themeName}</strong>
          </p>
          <p>
            {client.navCount} nav · {client.widgetCount} widgets
          </p>
        </div>
      </div>
      <div className="mt-4 grid md:grid-cols-2 gap-4 text-xs">
        <div>
          <p className="font-semibold text-neutral-400 mb-1">Enabled keys</p>
          <p className="font-mono text-neutral-700">
            {client.enabledModuleKeys.join(', ') || '-'}
          </p>
        </div>
        <div>
          <p className="font-semibold text-neutral-400 mb-1">Capability ids</p>
          <p className="font-mono text-neutral-700">
            {client.capabilityIds.join(', ') || '-'}
          </p>
        </div>
      </div>
      {client.plannedModuleKeys.length > 0 && (
        <p className="mt-3 text-xs text-amber-800">
          Planned: {client.plannedModuleKeys.join(', ')}
        </p>
      )}
      {client.missingCapabilityIds.length > 0 && (
        <p className="mt-2 text-xs text-rose-700">
          Missing in registry: {client.missingCapabilityIds.join(', ')}
        </p>
      )}
      <div className="mt-4 flex flex-wrap gap-4">
        <Link
          href={`/admin/reproduce-preview?client=${encodeURIComponent(client.id)}`}
          className="text-xs font-bold uppercase tracking-wider underline"
          style={{ color: NAVY }}
        >
          Reproduce preview
        </Link>
        <Link
          href={`/api/platform/clients?client=${encodeURIComponent(client.id)}`}
          className="text-xs font-bold uppercase tracking-wider underline"
          style={{ color: NAVY }}
        >
          Assembled JSON
        </Link>
      </div>
    </article>
  );
}

function WebsiteSectionCard({ section }: { section: WebsiteSectionRow }) {
  return (
    <article className="bg-white border border-neutral-200 p-5 flex flex-col gap-3">
      <div className="flex justify-between gap-3 items-start">
        <div>
          <p className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">
            {section.kind} ? {section.source}
          </p>
          <h3 className="text-lg font-bold mt-1" style={{ color: NAVY }}>
            {section.name}
          </h3>
          <p className="text-xs font-mono text-neutral-400 mt-1">{section.id}</p>
        </div>
        {section.category && (
          <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-neutral-100 text-neutral-700">
            {section.category}
          </span>
        )}
      </div>
      <p className="text-sm text-neutral-600">{section.description}</p>
      <dl className="grid grid-cols-2 gap-2 text-xs text-neutral-500">
        <div>
          <dt className="font-semibold text-neutral-400">Landing key</dt>
          <dd className="font-mono">{section.landingKey ?? '-'}</dd>
        </div>
        <div>
          <dt className="font-semibold text-neutral-400">Block id</dt>
          <dd className="font-mono">{section.blockId ?? '-'}</dd>
        </div>
      </dl>
    </article>
  );
}
