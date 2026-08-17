'use client';

import { useMemo, useState } from 'react';
import { CANONICAL_PROJECT_REGISTRY } from '@/lib/canonical-project-registry';

const linkFields = [
  ['Website', 'officialWebsite'],
  ['Portal', 'officialPortal'],
  ['Login', 'loginUrl'],
  ['Admin', 'adminUrl'],
] as const;

export default function ClientRegistryPage() {
  const [query, setQuery] = useState('');
  const matches = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return CANONICAL_PROJECT_REGISTRY;
    return CANONICAL_PROJECT_REGISTRY.filter((project) =>
      [project.id, project.name, ...project.aliases].some((item) =>
        item.toLowerCase().includes(value),
      ),
    );
  }, [query]);

  return (
    <main style={{ minHeight: '100vh', background: '#f6f4ef', color: '#171713', padding: '32px 18px 80px', fontFamily: 'Arial, sans-serif' }}>
      <div style={{ maxWidth: 1120, margin: '0 auto' }}>
        <p style={{ margin: 0, color: '#6f5a28', fontWeight: 800, letterSpacing: '0.12em', fontSize: 12 }}>EA COMMAND CENTER</p>
        <h1 style={{ margin: '10px 0 8px', fontFamily: 'Georgia, serif', fontSize: 'clamp(36px, 7vw, 72px)', lineHeight: 0.95 }}>Official client directory</h1>
        <p style={{ maxWidth: 760, color: '#55554d', fontSize: 18, lineHeight: 1.5 }}>
          One verified record per client and product. Missing information is shown as missing—never guessed.
        </p>

        <label htmlFor="registry-search" style={{ display: 'block', marginTop: 28, fontWeight: 800 }}>Find a client or product</label>
        <input
          id="registry-search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Try Amanda, Amplifi, CPR…"
          style={{ width: '100%', boxSizing: 'border-box', marginTop: 8, padding: '17px 18px', borderRadius: 16, border: '1px solid #c9c4b7', background: '#fff', color: '#171713', fontSize: 18 }}
        />

        <div style={{ display: 'grid', gap: 18, marginTop: 24 }}>
          {matches.map((project) => (
            <article key={project.id} style={{ background: '#fff', border: '1px solid #ded9cd', borderRadius: 22, padding: 22, boxShadow: '0 10px 30px rgba(50,40,20,.06)' }}>
              <div style={{ display: 'flex', gap: 14, justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap' }}>
                <div>
                  <p style={{ margin: 0, color: '#777267', fontSize: 12, fontWeight: 800, letterSpacing: '.1em' }}>{project.id} · {project.kind.toUpperCase()}</p>
                  <h2 style={{ margin: '6px 0 0', fontFamily: 'Georgia, serif', fontSize: 30 }}>{project.name}</h2>
                </div>
                <span style={{ padding: '8px 11px', borderRadius: 999, background: project.status === 'active' ? '#e5f5e9' : project.status === 'attention' ? '#fff1d5' : '#ececec', color: project.status === 'active' ? '#176a31' : '#70510c', fontWeight: 800, fontSize: 12 }}>
                  {project.status === 'active' ? 'VERIFIED ACTIVE' : project.status === 'attention' ? 'NEEDS ATTENTION' : 'REPOSITORY ONLY'}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))', gap: 10, marginTop: 20 }}>
                {linkFields.map(([label, field]) => {
                  const value = project[field];
                  return value ? (
                    <a key={field} href={value} target="_blank" rel="noreferrer" style={{ display: 'block', padding: 14, borderRadius: 14, background: '#f7f4ed', color: '#33270c', textDecoration: 'none' }}>
                      <small style={{ display: 'block', color: '#817960', fontWeight: 800 }}>{label}</small>
                      <strong style={{ display: 'block', marginTop: 5, overflowWrap: 'anywhere' }}>Open verified link ↗</strong>
                    </a>
                  ) : (
                    <div key={field} style={{ padding: 14, borderRadius: 14, background: '#fff0ec', color: '#822d1e' }}>
                      <small style={{ display: 'block', fontWeight: 800 }}>{label}</small>
                      <strong style={{ display: 'block', marginTop: 5 }}>Missing — do not guess</strong>
                    </div>
                  );
                })}
              </div>

              <dl style={{ display: 'grid', gridTemplateColumns: 'max-content 1fr', gap: '8px 14px', margin: '20px 0 0', fontSize: 14 }}>
                <dt style={{ color: '#777267' }}>GitHub</dt><dd style={{ margin: 0 }}>{project.githubRepo ?? 'Missing — do not guess'}</dd>
                <dt style={{ color: '#777267' }}>Vercel</dt><dd style={{ margin: 0 }}>{project.vercelProjects.join(', ') || 'Not applicable'}</dd>
                <dt style={{ color: '#777267' }}>Assets</dt><dd style={{ margin: 0, overflowWrap: 'anywhere' }}>{project.assetLocations.join(', ') || 'Missing — do not guess'}</dd>
                <dt style={{ color: '#777267' }}>Verified</dt><dd style={{ margin: 0 }}>{project.verifiedOn ?? 'Not verified'}</dd>
              </dl>

              {project.missing.length > 0 && (
                <p style={{ margin: '18px 0 0', padding: 13, borderRadius: 12, background: '#fff8e8', color: '#6f5010' }}>
                  <strong>Unresolved:</strong> {project.missing.join(', ')}
                </p>
              )}
              {project.notes && <p style={{ margin: '14px 0 0', color: '#5f5a50' }}>{project.notes}</p>}
            </article>
          ))}
          {matches.length === 0 && (
            <div style={{ padding: 28, borderRadius: 18, background: '#fff0ec', color: '#822d1e' }}>
              <strong>No canonical record exists.</strong> Do not invent a link. Add and verify the project first.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
