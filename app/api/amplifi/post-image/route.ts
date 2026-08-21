import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const COLORS = [
  ['#14213d', '#6d28d9'],
  ['#073b4c', '#0ea5a4'],
  ['#3b0764', '#c026d3'],
] as const;

function cleanTitle(value: string | null): string {
  return String(value || 'Your next message')
    .replace(/[\u2013\u2014]/g, ',')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 150);
}

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;',
  }[character] || character));
}

function titleLines(title: string): string[] {
  const words = title.split(' ');
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (candidate.length > 25 && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 4);
}

export async function GET(req: NextRequest) {
  const title = cleanTitle(req.nextUrl.searchParams.get('title'));
  const rawVariant = Number(req.nextUrl.searchParams.get('variant') || 0);
  const variant = Number.isFinite(rawVariant) ? Math.abs(Math.trunc(rawVariant)) % COLORS.length : 0;
  const [start, end] = COLORS[variant];
  const lines = titleLines(title);
  const fontSize = title.length > 85 ? 58 : title.length > 55 ? 68 : 82;
  const lineHeight = Math.round(fontSize * 1.12);
  const firstY = 540 - ((lines.length - 1) * lineHeight) / 2;
  const text = lines
    .map((line, index) => `<text x="88" y="${firstY + (index * lineHeight)}" fill="#ffffff" font-family="Arial, sans-serif" font-size="${fontSize}" font-weight="800">${escapeXml(line)}</text>`)
    .join('');

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1080" viewBox="0 0 1080 1080" role="img" aria-label="${escapeXml(title)}">
    <defs>
      <linearGradient id="background" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0%" stop-color="${start}"/>
        <stop offset="100%" stop-color="${end}"/>
      </linearGradient>
    </defs>
    <rect width="1080" height="1080" fill="url(#background)"/>
    <rect x="88" y="82" width="66" height="66" rx="18" fill="#ffffff" fill-opacity=".16"/>
    <text x="111" y="131" fill="#ffffff" font-family="Arial, sans-serif" font-size="38" font-weight="800">A</text>
    <text x="180" y="112" fill="#ffffff" font-family="Arial, sans-serif" font-size="30" font-weight="800" letter-spacing="6">AMPLIFI</text>
    <text x="180" y="143" fill="#ffffff" fill-opacity=".82" font-family="Arial, sans-serif" font-size="17" letter-spacing="4">BY EFFICIENCY ARCHITECTS</text>
    ${text}
    <rect x="88" y="965" width="140" height="9" rx="5" fill="#ffffff" fill-opacity=".9"/>
  </svg>`;

  return new NextResponse(svg, {
    status: 200,
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'Content-Disposition': 'inline; filename="amplifi-post.svg"',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
