import { AbsoluteFill, interpolate, useCurrentFrame } from 'remotion';
import { MUTED, WHITE } from '../palette';

export function CaptionLayer({ text, appearAt = 8 }: { text?: string; appearAt?: number }) {
  const frame = useCurrentFrame();
  if (!text?.trim()) return null;
  const opacity = interpolate(frame, [appearAt, appearAt + 10], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-end', padding: '0 96px 72px', opacity }}>
      <div
        style={{
          maxWidth: 1280,
          borderLeft: '3px solid rgba(201,168,68,0.85)',
          padding: '14px 22px',
          background: 'rgba(16,25,45,0.55)',
        }}
      >
        <div style={{ fontSize: 22, letterSpacing: 3, textTransform: 'uppercase', color: MUTED, marginBottom: 8 }}>
          Narration
        </div>
        <div style={{ fontSize: 28, lineHeight: 1.35, color: WHITE, fontWeight: 500 }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
}
