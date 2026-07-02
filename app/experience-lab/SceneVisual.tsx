'use client';

import { useState } from 'react';
import type { SceneVisualSpec } from '@/lib/ea-experience-lab';

type Props = {
  visual: SceneVisualSpec;
  variant?: 'hero' | 'wide' | 'tall';
  priority?: boolean;
};

export default function SceneVisual({ visual, variant = 'wide', priority }: Props) {
  const [failed, setFailed] = useState(false);
  const showImage = visual.src && !failed;

  return (
    <figure
      className={`eax-scene eax-scene-${variant} eax-scene-fallback-${visual.fallback}`}
      aria-label={visual.alt}
    >
      {showImage ? (
        <img
          src={visual.src}
          alt={visual.alt}
          className="eax-scene-img"
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          style={visual.position ? { objectPosition: visual.position } : undefined}
          onError={() => setFailed(true)}
        />
      ) : null}
      <div className="eax-scene-scrim" aria-hidden />
      {visual.caption ? (
        <figcaption className="eax-scene-caption">{visual.caption}</figcaption>
      ) : null}
    </figure>
  );
}
