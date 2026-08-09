import { GOLD, MUTED, WHITE } from '../palette';

export function SourceCitation({
  citations,
}: {
  citations?: Array<{ label: string; detail: string }>;
}) {
  if (!citations?.length) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 22, marginTop: 12 }}>
      {citations.map((item) => (
        <div key={item.label} style={{ borderTop: '1px solid rgba(201,168,68,0.25)', paddingTop: 16 }}>
          <div style={{ color: GOLD, fontSize: 22, letterSpacing: 2, textTransform: 'uppercase', marginBottom: 8 }}>
            {item.label}
          </div>
          <div style={{ color: WHITE, fontSize: 30, lineHeight: 1.35 }}>{item.detail}</div>
        </div>
      ))}
      <div style={{ color: MUTED, fontSize: 20, marginTop: 8 }}>Educational framing only. Not individualized advice.</div>
    </div>
  );
}
