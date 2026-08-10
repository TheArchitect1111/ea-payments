import type { ReactNode } from 'react';
import { AbsoluteFill, interpolate, useCurrentFrame, useVideoConfig } from 'remotion';
import { CREAM, GOLD, NAVY, NAVY_DEEP } from '../palette';

export function SceneFrame({ children }: { children: ReactNode }) {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const enter = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  const exit = interpolate(frame, [durationInFrames - 10, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const drift = interpolate(frame, [0, Math.max(durationInFrames, 1)], [0, 34], {
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, ${NAVY_DEEP} 0%, ${NAVY} 52%, #0b1120 100%)`,
        color: CREAM,
        fontFamily: 'Arial, Helvetica, sans-serif',
        opacity: Math.min(enter, exit),
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          width: 920,
          height: 920,
          right: -180 + drift,
          top: -340,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(201,168,68,0.20) 0%, rgba(201,168,68,0) 68%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.12,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,.18) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.18) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          transform: `translateX(${-drift / 2}px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 72,
          top: 64,
          width: 92,
          height: 8,
          borderRadius: 999,
          background: GOLD,
          boxShadow: '0 0 28px rgba(201,168,68,.36)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 72,
          right: 72,
          bottom: 72,
          height: 1,
          background: 'linear-gradient(90deg, rgba(201,168,68,.65), rgba(255,255,255,.08), transparent)',
        }}
      />
      <AbsoluteFill style={{ padding: '118px 118px 156px' }}>{children}</AbsoluteFill>
    </AbsoluteFill>
  );
}
