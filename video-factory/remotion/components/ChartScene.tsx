import { interpolate, useCurrentFrame } from 'remotion';
import { GOLD, MUTED, NAVY, WHITE } from '../palette';

export function ChartScene({
  chart,
}: {
  chart?: Array<{ label: string; value: number; note?: string }>;
}) {
  const frame = useCurrentFrame();
  if (!chart?.length) return null;
  const max = Math.max(...chart.map((item) => item.value), 1);

  return (
    <div style={{ display: 'flex', gap: 36, alignItems: 'flex-end', height: 420, marginTop: 20 }}>
      {chart.map((item, index) => {
        const progress = interpolate(frame, [8 + index * 6, 28 + index * 6], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });
        const height = Math.max(24, (item.value / max) * 360 * progress);
        return (
          <div key={item.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
            <div style={{ color: WHITE, fontSize: 36, fontWeight: 700, marginBottom: 10 }}>{item.value}</div>
            <div
              style={{
                height,
                background: `linear-gradient(180deg, ${GOLD} 0%, ${NAVY} 130%)`,
                borderTop: `3px solid ${GOLD}`,
              }}
            />
            <div style={{ color: WHITE, fontSize: 24, marginTop: 14, fontWeight: 600 }}>{item.label}</div>
            {item.note ? <div style={{ color: MUTED, fontSize: 18, marginTop: 6 }}>{item.note}</div> : null}
          </div>
        );
      })}
    </div>
  );
}
