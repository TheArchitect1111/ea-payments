import { ImageResponse } from 'next/og';
import type { NextRequest } from 'next/server';

export const runtime = 'edge';

const COLORS = [
  ['#14213d', '#6d28d9'],
  ['#073b4c', '#0ea5a4'],
  ['#3b0764', '#c026d3'],
] as const;

function cleanTitle(value: string | null): string {
  const title = String(value || 'Your next message').replace(/\s+/g, ' ').trim();
  return title.slice(0, 150);
}

export async function GET(req: NextRequest) {
  const title = cleanTitle(req.nextUrl.searchParams.get('title'));
  const variant = Math.abs(Number(req.nextUrl.searchParams.get('variant') || 0)) % COLORS.length;
  const [start, end] = COLORS[variant];

  return new ImageResponse(
    (
      <div
        style={{
          width: '1080px',
          height: '1080px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '88px',
          color: 'white',
          background: `linear-gradient(140deg, ${start} 0%, ${end} 100%)`,
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div style={{ width: '66px', height: '66px', borderRadius: '18px', background: 'rgba(255,255,255,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '38px', fontWeight: 800 }}>A</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '30px', fontWeight: 800, letterSpacing: '6px' }}>AMPLIFI</span>
            <span style={{ fontSize: '17px', letterSpacing: '4px', opacity: .82 }}>BY EFFICIENCY ARCHITECTS</span>
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: title.length > 85 ? '58px' : title.length > 55 ? '68px' : '82px', lineHeight: 1.08, fontWeight: 800, letterSpacing: '-2px', maxWidth: '900px' }}>
          {title}
        </div>
        <div style={{ width: '140px', height: '9px', borderRadius: '10px', background: 'white', opacity: .9 }} />
      </div>
    ),
    {
      width: 1080,
      height: 1080,
      headers: {
        'Cache-Control': 'public, max-age=31536000, immutable',
        'Content-Disposition': 'inline; filename="amplifi-post.png"',
      },
    },
  );
}
