import { NextRequest, NextResponse } from 'next/server';
import { connectQrFilename, renderConnectQrPng, renderConnectQrSvg } from '@/lib/connect-qr-render';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get('url') ?? 'https://www.efficiencyarchitects.online/connect/demo';
  const label = request.nextUrl.searchParams.get('label') ?? 'Connect QR';
  const format = request.nextUrl.searchParams.get('format') === 'png' ? 'png' : 'svg';
  const filename = connectQrFilename(label, format);

  if (format === 'png') {
    const png = await renderConnectQrPng(url);
    return new NextResponse(new Uint8Array(png), {
      headers: {
        'Content-Type': 'image/png',
        'Cache-Control': 'no-store',
        'Content-Disposition': `inline; filename="${filename}"`,
      },
    });
  }

  const svg = await renderConnectQrSvg(url, label);
  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'no-store',
      'Content-Disposition': `inline; filename="${filename}"`,
    },
  });
}
