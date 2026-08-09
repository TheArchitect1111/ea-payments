import { interpolate, useCurrentFrame } from 'remotion';
import { GOLD, MUTED, WHITE } from '../palette';

export function LowerThird({ kicker, headline }: { kicker?: string; headline?: string }) {
  const frame = useCurrentFrame();
  const x = interpolate(frame, [0, 16], [40, 0], { extrapolateRight: 'clamp' });
  const opacity = interpolate(frame, [0, 12], [0, 1], { extrapolateRight: 'clamp' });
  if (!kicker && !headline) return null;

  return (
    <div style={{ transform: `translateX(${x}px)`, opacity, marginBottom: 28 }}>
      {kicker ? (
        <div style={{ color: GOLD, letterSpacing: 4, textTransform: 'uppercase', fontSize: 22, marginBottom: 12 }}>
          {kicker}
        </div>
      ) : null}
      {headline ? (
        <div style={{ color: WHITE, fontSize: 64, lineHeight: 1.08, fontWeight: 650, maxWidth: 1400 }}>{headline}</div>
      ) : null}
      <div style={{ width: 72, height: 3, background: GOLD, marginTop: 18, opacity: 0.9 }} />
    </div>
  );
}
