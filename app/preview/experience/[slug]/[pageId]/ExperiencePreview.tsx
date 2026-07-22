'use client';

import type { CSSProperties } from 'react';
import { Render } from '@measured/puck';
import { puckConfig } from '@/lib/experience-builder/puck-config';
import type { Data } from '@measured/puck';
import '@/lib/experience-builder/experience-builder.css';
import '@/app/components/experience/themes/amanda-editorial/amanda-editorial.css';

function rootBrand(data: Data): { primary?: string; accent?: string; themeId?: string } {
  const props = (data.root as { props?: Record<string, unknown> } | undefined)?.props;
  const primary = typeof props?.primaryColor === 'string' ? props.primaryColor : undefined;
  const accent = typeof props?.accentColor === 'string' ? props.accentColor : undefined;
  const themeId = typeof props?.themeId === 'string' ? props.themeId : undefined;
  return { primary, accent, themeId };
}

export default function ExperiencePreview({
  title,
  data,
  footerLabel = 'Preview',
}: {
  title: string;
  data: Data;
  footerLabel?: string;
}) {
  const brand = rootBrand(data);
  const style: CSSProperties = {
    ...(brand.primary ? { ['--ea-navy' as string]: brand.primary } : {}),
    ...(brand.accent ? { ['--ea-gold' as string]: brand.accent } : {}),
  };

  return (
    <main style={style} className={brand.themeId === 'amanda-editorial' ? 'amanda-editorial-theme' : undefined}>
      <Render config={puckConfig} data={data} />
      <footer style={{ padding: '1rem', textAlign: 'center', fontSize: '0.8rem', color: '#667085' }}>
        {footerLabel} · {title}
      </footer>
    </main>
  );
}
