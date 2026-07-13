'use client';

import Link from 'next/link';
import { useMemo, type CSSProperties } from 'react';
import { useRouter } from 'next/navigation';

type ClientOption = { id: string; name: string; workspaceName: string; hasLandingCopy: boolean };

type PortalPreview = {
  name: string;
  workspaceName: string;
  cssVars: Record<string, string>;
  personalityName: string;
  themeId: string;
  terminology: Record<string, string>;
  homeLabel: string;
  membersLabel: string;
  startPrompt: string;
  navigation: Array<{ label: string; capabilityId: string }>;
  enabledCapabilityCount: number;
  missingCapabilityCount: number;
  widgets: Array<{ id: string; title: string }>;
  primaryActions: string[];
};

type LandingPreview = {
  pageId: string;
  pageName: string;
  cssVars: Record<string, string>;
  personalityName: string;
  themeId: string;
  copy: {
    brandName: string;
    workspaceName: string;
    heroHeadline: string;
    heroLede: string;
    ctaLabel: string;
    membersLabel: string;
    startPrompt: string;
    seoTitle: string;
    seoDescription: string;
  };
  sections: Array<{
    sectionId: string;
    kind: string;
    order: number;
    name: string;
    description: string;
    source: string;
    landingKey: string | null;
  }>;
  missingSectionIds: string[];
  seo: { title?: string; description?: string };
};

function ClientSwitcher({
  clients,
  clientId,
  onChange,
}: {
  clients: ClientOption[];
  clientId: string;
  onChange: (id: string) => void;
}) {
  return (
    <select
      value={clientId}
      onChange={(e) => onChange(e.target.value)}
      className="border px-3 py-2 text-xs font-bold uppercase tracking-wider"
      style={{ borderColor: 'var(--workspace-border, #ddd)', background: 'var(--workspace-surface, #fff)' }}
    >
      {clients.map((c) => (
        <option key={c.id} value={c.id}>
          {c.name}
        </option>
      ))}
    </select>
  );
}

function sectionBody(section: LandingPreview['sections'][number], landing: LandingPreview) {
  const { copy } = landing;
  switch (section.kind) {
    case 'brand':
      return (
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.28em]" style={{ color: 'var(--workspace-accent)' }}>
            {copy.brandName}
          </p>
          <p className="mt-1 text-sm" style={{ color: 'var(--workspace-muted-text)' }}>
            {copy.workspaceName}
          </p>
        </div>
      );
    case 'nav':
      return (
        <div className="flex flex-wrap gap-3 text-xs font-bold uppercase tracking-wider">
          {['Home', 'About', copy.membersLabel, 'Contact'].map((label) => (
            <span key={label} style={{ color: 'var(--workspace-primary)' }}>
              {label}
            </span>
          ))}
        </div>
      );
    case 'hero':
      return (
        <div className="max-w-2xl">
          <h2
            className="text-3xl font-black tracking-tight md:text-4xl"
            style={{ fontFamily: 'var(--workspace-font-heading)', color: 'var(--workspace-primary)' }}
          >
            {copy.heroHeadline}
          </h2>
          <p className="mt-3 text-base leading-7" style={{ color: 'var(--workspace-muted-text)' }}>
            {copy.heroLede}
          </p>
          <button
            type="button"
            className="mt-5 rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider text-white"
            style={{ background: 'var(--workspace-primary)' }}
          >
            {copy.ctaLabel}
          </button>
        </div>
      );
    case 'cta':
      return (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <p className="text-lg font-bold" style={{ color: 'var(--workspace-primary)' }}>
            Ready for {copy.membersLabel.toLowerCase()}?
          </p>
          <button
            type="button"
            className="rounded-full px-5 py-2 text-xs font-black uppercase tracking-wider"
            style={{ background: 'var(--workspace-accent)', color: 'var(--workspace-primary)' }}
          >
            {copy.ctaLabel}
          </button>
        </div>
      );
    case 'footer':
      return (
        <p className="text-xs" style={{ color: 'var(--workspace-muted-text)' }}>
          © {copy.brandName} · Assembled from ClientConfig · {landing.themeId}
        </p>
      );
    default:
      return (
        <p className="text-sm leading-6" style={{ color: 'var(--workspace-muted-text)' }}>
          {section.description || `${section.name} section for ${copy.brandName}.`}
        </p>
      );
  }
}

export default function ReproducePreviewClient({
  clients,
  clientId,
  portal,
  landing,
  urls,
  contentPack,
  domains,
}: {
  clients: ClientOption[];
  clientId: string;
  portal: PortalPreview | null;
  landing: LandingPreview | null;
  contentPack: { id: string; label: string; vertical: string; summary: string } | null;
  domains: Array<{ host: string; surface: string; label?: string }>;
  urls: {
    workspacePreview: string;
    reproducePreview: string;
    publicSite: string;
    websiteApi: string;
    workspaceApi: string;
    domainsApi: string;
  };
}) {
  const router = useRouter();
  const style = useMemo(
    () => (landing?.cssVars ?? portal?.cssVars ?? {}) as CSSProperties,
    [landing, portal],
  );

  return (
    <div
      className="min-h-screen"
      style={{
        ...style,
        background: 'var(--workspace-background, #FAF8F3)',
        color: 'var(--workspace-text, #111)',
        fontFamily: 'var(--workspace-font-body, Georgia, serif)',
      }}
    >
      <div className="mx-auto max-w-7xl space-y-6 px-6 py-8">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.3em]" style={{ color: 'var(--workspace-accent)' }}>
              Reproduction Engine
            </p>
            <h1
              className="mt-2 text-3xl font-black tracking-tight"
              style={{ fontFamily: 'var(--workspace-font-heading)', color: 'var(--workspace-primary)' }}
            >
              Reproduce Preview
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6" style={{ color: 'var(--workspace-muted-text)' }}>
              Portal shell and landing page from the same ClientConfig — theme, personality, capabilities, and
              section assembly.
            </p>
            {contentPack && (
              <p
                className="mt-3 inline-block border px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider"
                style={{ borderColor: 'var(--workspace-accent)', color: 'var(--workspace-primary)' }}
                title={contentPack.summary}
              >
                {contentPack.label} · {contentPack.vertical}
              </p>
            )}
            {clientId === 'cpr' && (
              <div
                className="mt-4 max-w-2xl border px-4 py-3 text-sm leading-6"
                style={{
                  borderColor: '#CC0000',
                  background: 'rgba(204,0,0,0.06)',
                  color: 'var(--workspace-primary)',
                }}
              >
                <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: '#CC0000' }}>
                  Login quarantine
                </p>
                <p className="mt-1">
                  Families sign in on the live CPR app —{' '}
                  <a
                    href="https://canadianprospectrecruitment.vercel.app/portal/login"
                    className="underline font-semibold"
                    target="_blank"
                    rel="noreferrer"
                  >
                    canadianprospectrecruitment.vercel.app/portal/login
                  </a>
                  . EA <code className="text-xs">/portal/cpr</code> and this preview are chassis only — not athlete/parent
                  accounts.
                </p>
              </div>
            )}
            {domains.length > 0 && (
              <div className="mt-3 space-y-1 text-xs" style={{ color: 'var(--workspace-muted-text)' }}>
                <p className="font-bold uppercase tracking-wider text-[10px]">Custom domains</p>
                {domains.map((d) => (
                  <p key={d.host} className="font-mono">
                    {d.host} → {d.surface}/{clientId}
                    {d.label ? ` · ${d.label}` : ''}
                  </p>
                ))}
                <Link href={urls.domainsApi} className="underline" style={{ color: 'var(--workspace-primary)' }}>
                  Domains JSON
                </Link>
              </div>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            <ClientSwitcher
              clients={clients}
              clientId={clientId}
              onChange={(id) => router.push(`/admin/reproduce-preview?client=${id}`)}
            />
            <Link
              href={urls.publicSite}
              className="border px-3 py-2 text-xs font-bold uppercase tracking-wider text-white"
              style={{ borderColor: 'var(--workspace-primary)', background: 'var(--workspace-primary)' }}
            >
              Public site
            </Link>
            <Link
              href={urls.workspacePreview}
              className="border px-3 py-2 text-xs font-bold uppercase tracking-wider"
              style={{ borderColor: 'var(--workspace-border)', background: 'var(--workspace-surface)' }}
            >
              Workspace only
            </Link>
            <Link
              href="/admin/ea-factory/client-factory"
              className="border px-3 py-2 text-xs font-bold uppercase tracking-wider"
              style={{ borderColor: 'var(--workspace-border)', background: 'var(--workspace-surface)' }}
            >
              New Client
            </Link>
            <Link
              href={urls.websiteApi}
              className="border px-3 py-2 text-xs font-bold uppercase tracking-wider"
              style={{ borderColor: 'var(--workspace-border)', background: 'var(--workspace-surface)' }}
            >
              JSON
            </Link>
          </div>
        </header>

        {!portal && !landing ? (
          <p className="text-sm" style={{ color: 'var(--workspace-muted-text)' }}>
            Unknown client. Pick another preset.
          </p>
        ) : (
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Portal column */}
            <section
              className="space-y-4 border p-5"
              style={{ background: 'var(--workspace-surface)', borderColor: 'var(--workspace-border)' }}
            >
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--workspace-accent)' }}>
                  Portal surface
                </p>
                <h2
                  className="mt-1 text-2xl font-black"
                  style={{ fontFamily: 'var(--workspace-font-heading)', color: 'var(--workspace-primary)' }}
                >
                  {portal?.homeLabel ?? 'Portal'}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--workspace-muted-text)' }}>
                  {portal?.name} · {portal?.personalityName} · {portal?.themeId}
                </p>
              </div>

              {portal && (
                <>
                  <p className="text-sm leading-6" style={{ color: 'var(--workspace-muted-text)' }}>
                    {portal.startPrompt}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {portal.navigation.length === 0 ? (
                      <span className="text-xs" style={{ color: 'var(--workspace-muted-text)' }}>
                        No capability nav yet
                      </span>
                    ) : (
                      portal.navigation.map((item) => (
                        <span
                          key={`${item.capabilityId}-${item.label}`}
                          className="border px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider"
                          style={{ borderColor: 'var(--workspace-border)', color: 'var(--workspace-primary)' }}
                        >
                          {item.label || item.capabilityId}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="border p-3" style={{ borderColor: 'var(--workspace-border)' }}>
                      <p style={{ color: 'var(--workspace-muted-text)' }}>Capabilities</p>
                      <p className="text-xl font-black" style={{ color: 'var(--workspace-primary)' }}>
                        {portal.enabledCapabilityCount}
                      </p>
                    </div>
                    <div className="border p-3" style={{ borderColor: 'var(--workspace-border)' }}>
                      <p style={{ color: 'var(--workspace-muted-text)' }}>Missing</p>
                      <p className="text-xl font-black" style={{ color: 'var(--workspace-primary)' }}>
                        {portal.missingCapabilityCount}
                      </p>
                    </div>
                  </div>
                  {portal.widgets.length > 0 && (
                    <div>
                      <p className="mb-2 text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--workspace-muted-text)' }}>
                        Widgets
                      </p>
                      <ul className="space-y-1 text-sm">
                        {portal.widgets.map((w) => (
                          <li key={w.id}>{w.title}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {portal.primaryActions.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {portal.primaryActions.map((action) => (
                        <span
                          key={action}
                          className="rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white"
                          style={{ background: 'var(--workspace-primary)' }}
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  )}
                </>
              )}
            </section>

            {/* Landing column */}
            <section className="space-y-3">
              <div className="px-1">
                <p className="text-[11px] font-bold uppercase tracking-wider" style={{ color: 'var(--workspace-accent)' }}>
                  Landing surface
                </p>
                <h2
                  className="mt-1 text-2xl font-black"
                  style={{ fontFamily: 'var(--workspace-font-heading)', color: 'var(--workspace-primary)' }}
                >
                  {landing?.pageName ?? 'Landing'}
                </h2>
                <p className="mt-1 text-sm" style={{ color: 'var(--workspace-muted-text)' }}>
                  {landing?.copy.seoTitle} · {landing?.sections.length ?? 0} sections
                </p>
              </div>

              {landing?.missingSectionIds.length ? (
                <p className="text-xs text-amber-800">
                  Missing section defs: {landing.missingSectionIds.join(', ')}
                </p>
              ) : null}

              {landing?.sections.map((section) => (
                <article
                  key={section.sectionId}
                  className="border p-4"
                  style={{
                    background:
                      section.kind === 'hero' || section.kind === 'cta'
                        ? 'var(--workspace-surface)'
                        : 'color-mix(in srgb, var(--workspace-surface) 92%, transparent)',
                    borderColor: 'var(--workspace-border)',
                  }}
                >
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: 'var(--workspace-accent)' }}>
                      {section.kind} · {section.name}
                    </p>
                    <p className="text-[10px]" style={{ color: 'var(--workspace-muted-text)' }}>
                      {section.sectionId}
                    </p>
                  </div>
                  {sectionBody(section, landing)}
                </article>
              ))}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
