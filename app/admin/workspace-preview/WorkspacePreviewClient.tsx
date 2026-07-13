'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';

type ClientOption = { id: string; name: string; workspaceName: string };

type PreviewShell = {
  organizationId: string;
  name: string;
  workspaceName: string;
  cssVars: Record<string, string>;
  theme: {
    id: string;
    primaryColor: string;
    accentColor: string;
    backgroundColor: string;
    surfaceColor: string;
    textColor: string;
    mutedTextColor: string;
    borderColor: string;
    fontHeading: string;
    fontBody: string;
  };
  personality: {
    id: string;
    name: string;
    density: string;
    informationDepth: string;
  };
  terminology: Record<string, string>;
  sectionOrder: string[];
  dashboardSections: string[];
  primaryActions: string[];
  emptyStateLanguage: string;
  aiContext: string;
  navigation: Array<{ capabilityId: string; label: string; path: string; group?: string }>;
  widgets: Array<{ capabilityId: string; id: string; title: string; zone?: string }>;
  aiSkills: Array<{ capabilityId: string; id: string; description: string }>;
  enabledCapabilityIds: string[];
  missingCapabilityIds: string[];
};

export default function WorkspacePreviewClient({
  clients,
  clientId,
  shell,
}: {
  clients: ClientOption[];
  clientId: string;
  shell: PreviewShell | null;
}) {
  const router = useRouter();
  const style = useMemo(() => (shell?.cssVars ?? {}) as React.CSSProperties, [shell]);

  if (!shell) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-10">
        <p className="text-sm text-neutral-500">Unknown client. Pick another workspace.</p>
        <ClientSwitcher clients={clients} clientId={clientId} onChange={(id) => router.push(`/admin/workspace-preview?client=${id}`)} />
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ ...style, background: 'var(--workspace-background)', color: 'var(--workspace-text)', fontFamily: 'var(--workspace-font-body)' }}>
      <div className="max-w-6xl mx-auto px-6 py-8 space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--workspace-accent)' }}>
              Workspace Shell Preview
            </p>
            <h1 className="text-3xl font-extrabold" style={{ fontFamily: 'var(--workspace-font-heading)', color: 'var(--workspace-primary)' }}>
              {shell.terminology.home || shell.workspaceName}
            </h1>
            <p className="text-sm mt-2" style={{ color: 'var(--workspace-muted-text)' }}>
              {shell.name} · {shell.personality.name} · {shell.theme.id}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <ClientSwitcher
              clients={clients}
              clientId={clientId}
              onChange={(id) => router.push(`/admin/workspace-preview?client=${id}`)}
            />
            <Link
              href="/admin/capability-marketplace"
              className="text-xs font-bold uppercase tracking-wider border px-3 py-2"
              style={{ borderColor: 'var(--workspace-border)', background: 'var(--workspace-surface)' }}
            >
              Marketplace
            </Link>
          </div>
        </div>

        <div
          className="rounded-lg border p-4 flex flex-wrap gap-2"
          style={{ background: 'var(--workspace-surface)', borderColor: 'var(--workspace-border)', boxShadow: 'var(--workspace-shadow)' }}
        >
          {(shell.navigation.length ? shell.navigation : [{ capabilityId: 'home', label: shell.terminology.home || 'Home', path: '' }]).map((item) => (
            <span
              key={`${item.capabilityId}-${item.path}-${item.label}`}
              className="text-xs font-bold uppercase tracking-wider px-3 py-2 border"
              style={{ borderColor: 'var(--workspace-border)', color: 'var(--workspace-primary)' }}
            >
              {item.label || item.capabilityId}
            </span>
          ))}
          {shell.navigation.length === 0 && (
            <span className="text-xs" style={{ color: 'var(--workspace-muted-text)' }}>
              No capability nav contributions yet — shell still applies theme and personality.
            </span>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <div className="md:col-span-2 space-y-4">
            <section
              className="rounded-lg border p-5"
              style={{ background: 'var(--workspace-surface)', borderColor: 'var(--workspace-border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--workspace-accent)' }}>
                {shell.terminology.focus || "Today's Focus"}
              </p>
              <h2 className="text-xl font-bold mt-2" style={{ fontFamily: 'var(--workspace-font-heading)' }}>
                {shell.terminology.startPrompt || 'What would you like to do next?'}
              </h2>
              <div className="mt-4 flex flex-wrap gap-2">
                {shell.primaryActions.map((action) => (
                  <button
                    key={action}
                    type="button"
                    className="text-xs font-bold uppercase tracking-wider px-3 py-2"
                    style={{ background: 'var(--workspace-primary)', color: 'var(--workspace-on-primary, #fff)' }}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </section>

            <section
              className="rounded-lg border p-5"
              style={{ background: 'var(--workspace-surface)', borderColor: 'var(--workspace-border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--workspace-accent)' }}>
                {shell.terminology.attention || 'Needs Attention'}
              </p>
              {shell.widgets.length === 0 ? (
                <p className="text-sm mt-3" style={{ color: 'var(--workspace-muted-text)' }}>
                  {shell.emptyStateLanguage}
                </p>
              ) : (
                <div className="mt-3 grid sm:grid-cols-2 gap-3">
                  {shell.widgets.map((widget) => (
                    <div
                      key={`${widget.capabilityId}-${widget.id}`}
                      className="border p-3"
                      style={{ borderColor: 'var(--workspace-border)' }}
                    >
                      <p className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--workspace-muted-text)' }}>
                        {widget.zone || 'widget'}
                      </p>
                      <p className="font-semibold mt-1">{widget.title}</p>
                      <p className="text-xs font-mono mt-1" style={{ color: 'var(--workspace-muted-text)' }}>
                        {widget.capabilityId}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </section>

            <section
              className="rounded-lg border p-5"
              style={{ background: 'var(--workspace-surface)', borderColor: 'var(--workspace-border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--workspace-accent)' }}>
                Section order
              </p>
              <ol className="mt-3 space-y-1 text-sm">
                {shell.sectionOrder.map((section, index) => (
                  <li key={section}>
                    <span className="font-mono text-xs mr-2" style={{ color: 'var(--workspace-muted-text)' }}>
                      {index + 1}
                    </span>
                    {section}
                  </li>
                ))}
              </ol>
            </section>
          </div>

          <aside className="space-y-4">
            <section
              className="rounded-lg border p-5"
              style={{ background: 'var(--workspace-surface)', borderColor: 'var(--workspace-border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--workspace-accent)' }}>
                AI context
              </p>
              <p className="text-sm mt-3 whitespace-pre-wrap" style={{ color: 'var(--workspace-muted-text)' }}>
                {shell.aiContext}
              </p>
              {shell.aiSkills.length > 0 && (
                <ul className="mt-3 space-y-1 text-xs">
                  {shell.aiSkills.map((skill) => (
                    <li key={`${skill.capabilityId}-${skill.id}`}>• {skill.description}</li>
                  ))}
                </ul>
              )}
            </section>

            <section
              className="rounded-lg border p-5"
              style={{ background: 'var(--workspace-surface)', borderColor: 'var(--workspace-border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--workspace-accent)' }}>
                Shell meta
              </p>
              <dl className="mt-3 space-y-2 text-xs">
                <div>
                  <dt style={{ color: 'var(--workspace-muted-text)' }}>Density</dt>
                  <dd className="font-semibold">{shell.personality.density}</dd>
                </div>
                <div>
                  <dt style={{ color: 'var(--workspace-muted-text)' }}>Depth</dt>
                  <dd className="font-semibold">{shell.personality.informationDepth}</dd>
                </div>
                <div>
                  <dt style={{ color: 'var(--workspace-muted-text)' }}>Capabilities</dt>
                  <dd className="font-semibold">{shell.enabledCapabilityIds.length}</dd>
                </div>
                <div>
                  <dt style={{ color: 'var(--workspace-muted-text)' }}>Members label</dt>
                  <dd className="font-semibold">{shell.terminology.members || '-'}</dd>
                </div>
              </dl>
              {shell.missingCapabilityIds.length > 0 && (
                <p className="text-xs mt-3" style={{ color: 'var(--workspace-danger, #b91c1c)' }}>
                  Missing: {shell.missingCapabilityIds.join(', ')}
                </p>
              )}
              <Link
                href={`/api/platform/workspace?client=${encodeURIComponent(clientId)}`}
                className="inline-block mt-4 text-xs font-bold uppercase tracking-wider underline"
                style={{ color: 'var(--workspace-primary)' }}
              >
                Shell JSON
              </Link>
            </section>

            <section
              className="rounded-lg border p-5"
              style={{ background: 'var(--workspace-surface)', borderColor: 'var(--workspace-border)' }}
            >
              <p className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--workspace-accent)' }}>
                Theme swatches
              </p>
              <div className="mt-3 grid grid-cols-4 gap-2">
                {[
                  shell.theme.primaryColor,
                  shell.theme.accentColor,
                  shell.theme.backgroundColor,
                  shell.theme.surfaceColor,
                ].map((color) => (
                  <div key={color} className="h-10 border" style={{ background: color, borderColor: 'var(--workspace-border)' }} title={color} />
                ))}
              </div>
            </section>
          </aside>
        </div>
      </div>
    </div>
  );
}

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
      className="text-xs font-bold uppercase tracking-wider border px-3 py-2 bg-white"
      style={{ borderColor: 'var(--workspace-border, #e5e5e5)', color: 'var(--workspace-primary, #111)' }}
    >
      {clients.map((client) => (
        <option key={client.id} value={client.id}>
          {client.workspaceName}
        </option>
      ))}
    </select>
  );
}