'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { Puck, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
import { puckConfig } from '@/lib/experience-builder/puck-config';
import type { ExperiencePage } from '@/lib/experience-builder/types';

type ExperienceBuilderEditorProps = {
  slug: string;
  page: ExperiencePage;
};

export default function ExperienceBuilderEditor({ slug, page }: ExperienceBuilderEditorProps) {
  const [status, setStatus] = useState<string>('');
  const previewHref = page.previewPath;

  const saveDraft = useCallback(
    async (data: Data) => {
      setStatus('Saving…');
      const response = await fetch(`/api/portal/experience-pages/${page.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ slug, title: page.title, puckData: data }),
      });
      const payload = await response.json();
      if (!response.ok || !payload.ok) {
        setStatus(payload.error ?? 'Save failed.');
        return false;
      }
      setStatus('Saved');
      return true;
    },
    [page.id, page.title, slug],
  );

  return (
    <div className="eb-builder-shell">
      <Puck
        config={puckConfig}
        data={page.puckData}
        onChange={(data) => {
          void saveDraft(data);
        }}
        overrides={{
          headerActions: ({ children }) => (
            <>
              <Link href={`/portal/${slug}/experience-builder`} className="eb-btn eb-btn-secondary">
                Back
              </Link>
              <a href={previewHref} target="_blank" rel="noreferrer" className="eb-btn eb-btn-secondary">
                Preview
              </a>
              {children}
              <span style={{ fontSize: '0.8rem', color: '#64748b' }}>{status}</span>
            </>
          ),
        }}
        onPublish={async (data) => {
          const saved = await saveDraft(data);
          if (!saved) return;
          setStatus('Publishing…');
          const response = await fetch(`/api/portal/experience-pages/${page.id}/publish`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ slug }),
          });
          const payload = await response.json();
          setStatus(payload.ok ? `Published (${payload.mode})` : payload.error ?? 'Publish failed.');
        }}
      />
    </div>
  );
}
