import { NextRequest, NextResponse } from 'next/server';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const ALLOWED = new Map([
  ['AesthetiKine 1-Day Nervous System Reset Manual.pdf', 12801515],
  ['Amanda-Catherine-Video-01.mp4', 18503215],
  ['Amanda-Catherine-Video-02.mp4', 7657265],
  ['Amanda-Catherine-Video-03.mp4', 9365928],
  ['VID-20260821-WA0006.mp4', 41565530],
  ['VID-20260821-WA0007.mp4', 15958756],
  ['VID-20260821-WA0008.mp4', 45837800],
  ['VID-20260821-WA0009.mp4', 62923358],
]);

export async function GET(req: NextRequest) {
  const source = req.nextUrl.searchParams.get('source');
  const name = req.nextUrl.searchParams.get('name');
  if (!source || !name || !ALLOWED.has(name)) return NextResponse.json({ ok:false, error:'invalid request' }, { status:400 });
  let u: URL;
  try { u = new URL(source); } catch { return NextResponse.json({ok:false,error:'bad source'}, {status:400}); }
  if (u.protocol !== 'https:' || !u.hostname.endsWith('.dropboxusercontent.com')) return NextResponse.json({ok:false,error:'source not allowed'}, {status:403});
  const r = await fetch(source, { redirect:'follow', cache:'no-store' });
  if (!r.ok) return NextResponse.json({ok:false,error:`source ${r.status}`}, {status:502});
  const bytes = new Uint8Array(await r.arrayBuffer());
  const expected = ALLOWED.get(name)!;
  if (bytes.byteLength !== expected) return NextResponse.json({ok:false,error:'size mismatch',expected,actual:bytes.byteLength},{status:422});
  const contentType = name.endsWith('.pdf') ? 'application/pdf' : 'video/mp4';
  const blob = await put(name, bytes, { access:'private', addRandomSuffix:false, allowOverwrite:false, contentType });
  return NextResponse.json({ok:true,name,size:bytes.byteLength,pathname:blob.pathname});
}
