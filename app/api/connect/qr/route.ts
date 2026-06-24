import { NextRequest, NextResponse } from 'next/server';
import QRCode from 'qrcode';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') ?? 'https://www.efficiencyarchitects.online/connect/demo';
  const label = request.nextUrl.searchParams.get('label') ?? 'Connect QR';
  const qr = await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    width: 720,
    color: {
      dark: '#111111',
      light: '#ffffff',
    },
  });

  const caption = label.replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[char] ?? char));
  const svg = qr.replace(
    '</svg>',
    `<text x="50%" y="96%" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111111">${caption}</text></svg>`,
  );

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Disposition': `inline; filename="${label.toLowerCase().replace(/[^a-z0-9]+/g, '-') || 'connect-qr'}.svg"`,
    },
  });
}
