'use client';

import { Render } from '@measured/puck';
import { puckConfig } from '@/lib/experience-builder/puck-config';
import type { Data } from '@measured/puck';
import '@/lib/experience-builder/experience-builder.css';

export default function ExperiencePreview({
  title,
  data,
  footerLabel = 'Preview',
}: {
  title: string;
  data: Data;
  footerLabel?: string;
}) {
  return (
    <main>
      <Render config={puckConfig} data={data} />
      <footer style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#667085' }}>
        {footerLabel} · {title}
      </footer>
    </main>
  );
}
