import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

function clean(value: string | null, fallback: string, max = 220) {
  return String(value || fallback).replace(/[\u2013\u2014]/g, ',').replace(/\s+/g, ' ').trim().slice(0, max);
}

function safeHex(value: string | null, fallback: string) {
  const candidate = String(value || '').trim();
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(candidate) ? candidate : fallback;
}

function escapeXml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[character] || character));
}

function wrap(text: string, max: number, linesMax: number) {
  const words = text.split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > max && line) {
      lines.push(line);
      line = word;
      if (lines.length >= linesMax - 1) break;
    } else line = next;
  }
  if (line && lines.length < linesMax) lines.push(line);
  return lines;
}

export async function GET(req: NextRequest) {
  const format = req.nextUrl.searchParams.get('format');
  const portrait = format === 'portrait';
  const story = format === 'story';
  const landscape = format === 'landscape';
  const width = landscape ? 1200 : 1080;
  const height = story ? 1920 : portrait ? 1350 : landscape ? 630 : 1080;
  const title = clean(req.nextUrl.searchParams.get('title'), 'Your next message', 100);
  const subhead = clean(req.nextUrl.searchParams.get('subhead'), '', 170);
  const objective = clean(req.nextUrl.searchParams.get('objective'), 'Move the audience toward the next useful action.', 120);
  const brand = clean(req.nextUrl.searchParams.get('brand'), 'Amplifi', 60);
  const cta = clean(req.nextUrl.searchParams.get('cta'), '', 70);
  const primary = safeHex(req.nextUrl.searchParams.get('primary'), '#0b0b0c');
  const accent = safeHex(req.nextUrl.searchParams.get('accent'), '#ffffff');
  const titleLines = wrap(title, landscape ? 31 : 24, 4);
  const subLines = subhead ? wrap(subhead, landscape ? 60 : 43, 3) : [];
  const headlineSize = story ? 92 : portrait ? 76 : landscape ? 68 : 78;
  const titleStart = story ? 720 : portrait ? 520 : landscape ? 250 : 410;
  const lineHeight = Math.round(headlineSize * 1.06);

  const headlineSvg = titleLines.map((line, index) => `<text x="80" y="${titleStart + index * lineHeight}" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="${headlineSize}" font-weight="700">${escapeXml(line)}</text>`).join('');
  const subStart = titleStart + titleLines.length * lineHeight + 38;
  const subSvg = subLines.map((line, index) => `<text x="80" y="${subStart + index * 42}" fill="${accent}" fill-opacity=".72" font-family="Arial, Helvetica, sans-serif" font-size="30">${escapeXml(line)}</text>`).join('');
  const ctaWidth = Math.max(180, Math.min(520, 70 + cta.length * 15));

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">
    <rect width="${width}" height="${height}" fill="${primary}"/>
    <circle cx="${width - 90}" cy="90" r="180" fill="${accent}" fill-opacity=".035"/>
    <text x="80" y="92" fill="${accent}" fill-opacity=".78" font-family="Arial, Helvetica, sans-serif" font-size="26" font-weight="700" letter-spacing="4">${escapeXml(brand.toUpperCase())}</text>
    ${headlineSvg}
    ${subSvg}
    <text x="80" y="${height - 72}" fill="${accent}" fill-opacity=".56" font-family="Arial, Helvetica, sans-serif" font-size="22">${escapeXml(objective)}</text>
    ${cta ? `<rect x="${width - ctaWidth - 80}" y="${height - 118}" width="${ctaWidth}" height="62" rx="31" fill="none" stroke="${accent}" stroke-width="2"/><text x="${width - ctaWidth / 2 - 80}" y="${height - 78}" text-anchor="middle" fill="${accent}" font-family="Arial, Helvetica, sans-serif" font-size="22" font-weight="700">${escapeXml(cta)}</text>` : ''}
  </svg>`;

  return new NextResponse(svg, {
    headers: {
      'Content-Type': 'image/svg+xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600, stale-while-revalidate=86400',
      'X-EA-Creative-Foundry': 'v1',
      'X-Content-Type-Options': 'nosniff',
    },
  });
}
