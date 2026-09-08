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
  const words = text.split(/\s+/).filter(Boolean); const lines: string[] = []; let line = '';
  for (const word of words) { const next = line ? `${line} ${word}` : word; if (next.length > max && line) { lines.push(line); line = word; if (lines.length >= linesMax - 1) break; } else line = next; }
  if (line && lines.length < linesMax) lines.push(line); return lines;
}
function textLines(lines: string[], x: number, y: number, size: number, lineHeight: number, fill: string, weight = 700, anchor = 'start') {
  return lines.map((line, index) => `<text x="${x}" y="${y + index * lineHeight}" text-anchor="${anchor}" fill="${fill}" font-family="Arial, Helvetica, sans-serif" font-size="${size}" font-weight="${weight}">${escapeXml(line)}</text>`).join('');
}

export async function GET(req: NextRequest) {
  const format = clean(req.nextUrl.searchParams.get('format'), 'square', 20);
  const layout = clean(req.nextUrl.searchParams.get('layout'), 'editorial-hero', 40);
  const portrait = format === 'portrait' || format === 'carousel'; const story = format === 'story'; const landscape = format === 'landscape';
  const width = landscape ? 1200 : 1080; const height = story ? 1920 : portrait ? 1350 : landscape ? 630 : 1080;
  const title = clean(req.nextUrl.searchParams.get('title'), 'Your next message', 100);
  const subhead = clean(req.nextUrl.searchParams.get('subhead'), '', 170);
  const objective = clean(req.nextUrl.searchParams.get('objective'), 'Move the audience toward the next useful action.', 120);
  const brand = clean(req.nextUrl.searchParams.get('brand'), 'Amplifi', 60);
  const cta = clean(req.nextUrl.searchParams.get('cta'), '', 70);
  const primary = safeHex(req.nextUrl.searchParams.get('primary'), '#0b0b0c');
  const accent = safeHex(req.nextUrl.searchParams.get('accent'), '#f6f4ef');
  const titleLines = wrap(title, landscape ? 31 : 23, 4); const subLines = subhead ? wrap(subhead, landscape ? 58 : 42, 3) : [];
  const pad = landscape ? 68 : 78;
  const ctaWidth = Math.max(180, Math.min(520, 70 + cta.length * 15));
  const brandMark = `<text x="${pad}" y="${pad + 18}" fill="${accent}" fill-opacity=".78" font-family="Arial, Helvetica, sans-serif" font-size="23" font-weight="700" letter-spacing="4">${escapeXml(brand.toUpperCase())}</text>`;
  const footer = `<text x="${pad}" y="${height - 58}" fill="${accent}" fill-opacity=".48" font-family="Arial, Helvetica, sans-serif" font-size="19">${escapeXml(objective)}</text>`;
  const ctaSvg = cta ? `<rect x="${width - ctaWidth - pad}" y="${height - 106}" width="${ctaWidth}" height="58" rx="29" fill="${accent}"/><text x="${width - ctaWidth / 2 - pad}" y="${height - 69}" text-anchor="middle" fill="${primary}" font-family="Arial, Helvetica, sans-serif" font-size="20" font-weight="700">${escapeXml(cta)}</text>` : '';

  let body = '';
  if (layout === 'quote-minimal') {
    const size = story ? 80 : portrait ? 68 : 72;
    body = `<rect width="${width}" height="${height}" fill="${primary}"/><circle cx="${width * .82}" cy="${height * .18}" r="${Math.min(width,height)*.28}" fill="${accent}" fill-opacity=".055"/><text x="${pad}" y="${height*.25}" fill="${accent}" fill-opacity=".32" font-size="150" font-family="Georgia,serif">“</text>${textLines(titleLines,pad,height*.42,size,Math.round(size*1.14),accent,500)}${subLines.length?textLines(subLines,pad,height*.68,28,40,accent,400):''}`;
  } else if (layout === 'promotion-offer') {
    const size = story ? 88 : portrait ? 72 : 74;
    body = `<rect width="${width}" height="${height}" fill="${primary}"/><rect x="${pad}" y="${height*.2}" width="${width-pad*2}" height="${height*.5}" rx="44" fill="${accent}" fill-opacity=".07" stroke="${accent}" stroke-opacity=".16"/><circle cx="${width-pad-80}" cy="${height*.25}" r="120" fill="${accent}" fill-opacity=".1"/>${textLines(titleLines,pad+52,height*.36,size,Math.round(size*1.08),accent,800)}${subLines.length?textLines(subLines,pad+52,height*.61,29,40,accent,400):''}`;
  } else if (layout === 'story-proof') {
    const size = story ? 82 : portrait ? 68 : 70;
    body = `<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${primary}"/><stop offset="1" stop-color="${accent}" stop-opacity=".16"/></linearGradient></defs><rect width="${width}" height="${height}" fill="url(#g)"/><path d="M0 ${height*.72} C ${width*.25} ${height*.58}, ${width*.65} ${height*.9}, ${width} ${height*.55} L ${width} ${height} L 0 ${height} Z" fill="${accent}" fill-opacity=".06"/>${textLines(titleLines,pad,height*.4,size,Math.round(size*1.08),accent,750)}${subLines.length?textLines(subLines,pad,height*.67,28,39,accent,400):''}`;
  } else if (layout === 'editorial-split') {
    const size = story ? 86 : portrait ? 68 : 70;
    body = `<rect width="${width}" height="${height}" fill="${primary}"/><rect x="${width*.58}" width="${width*.42}" height="${height}" fill="${accent}" fill-opacity=".09"/><circle cx="${width*.78}" cy="${height*.34}" r="${Math.min(width,height)*.22}" fill="none" stroke="${accent}" stroke-opacity=".18" stroke-width="3"/>${textLines(titleLines,pad,height*.38,size,Math.round(size*1.08),accent,750)}${subLines.length?textLines(subLines,pad,height*.66,27,38,accent,400):''}`;
  } else if (layout === 'product-clean') {
    const size = story ? 88 : portrait ? 70 : 72;
    body = `<rect width="${width}" height="${height}" fill="${primary}"/><rect x="${pad}" y="${height*.16}" width="${width-pad*2}" height="${height*.3}" rx="38" fill="${accent}" fill-opacity=".04"/><line x1="${pad}" y1="${height*.53}" x2="${width-pad}" y2="${height*.53}" stroke="${accent}" stroke-opacity=".2"/>${textLines(titleLines,pad,height*.68,size,Math.round(size*1.08),accent,800)}${subLines.length?textLines(subLines,pad,height*.86,26,36,accent,400):''}`;
  } else {
    const size = story ? 92 : portrait ? 76 : landscape ? 68 : 78;
    const start = story ? height*.41 : portrait ? height*.39 : landscape ? height*.43 : height*.38;
    body = `<defs><radialGradient id="r" cx="82%" cy="10%" r="80%"><stop offset="0" stop-color="${accent}" stop-opacity=".11"/><stop offset="1" stop-color="${primary}" stop-opacity="0"/></radialGradient></defs><rect width="${width}" height="${height}" fill="${primary}"/><rect width="${width}" height="${height}" fill="url(#r)"/><circle cx="${width-90}" cy="90" r="180" fill="${accent}" fill-opacity=".035"/>${textLines(titleLines,pad,start,size,Math.round(size*1.06),accent,800)}${subLines.length?textLines(subLines,pad,start+titleLines.length*Math.round(size*1.06)+42,29,40,accent,400):''}`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${escapeXml(title)}">${body}${brandMark}${footer}${ctaSvg}<text x="${width-pad}" y="${pad+18}" text-anchor="end" fill="${accent}" fill-opacity=".26" font-family="Arial,Helvetica,sans-serif" font-size="15" letter-spacing="3">AMPLIFI CREATIVE FOUNDRY</text></svg>`;
  return new NextResponse(svg,{headers:{'Content-Type':'image/svg+xml; charset=utf-8','Cache-Control':'public, max-age=3600, stale-while-revalidate=86400','X-EA-Creative-Foundry':'v2','X-EA-Design-Family':layout,'X-Content-Type-Options':'nosniff'}});
}
