import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { CREAM, NAVY, NAVY_DEEP } from '../palette';

export function SceneFrame({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = interpolate(frame, [0, 14], [0, 1], { extrapolateRight: 'clamp' });
  const exit = interpolate(frame, [durationInFrames - 12, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(1200px 800px at 18% 12%, #243764 0%, ${NAVY} 42%, ${NAVY_DEEP} 100%)`,
        color: CREAM,
        fontFamily: 'Georgia, "Times New Roman", serif',
        opacity: Math.min(enter, exit),
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 36,
          border: '1px solid rgba(201,168,68,0.22)',
        }}
      />
      <AbsoluteFill style={{ padding: '96px 110px 150px' }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}
