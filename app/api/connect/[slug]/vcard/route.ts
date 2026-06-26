import { NextRequest, NextResponse } from 'next/server';
import { getConnectProfileBySlug } from '@/lib/connect-store';

export const dynamic = 'force-dynamic';

function clean(value = '') {
  return value.replace(/\r?\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;').trim();
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const profile = await getConnectProfileBySlug(slug);

  if (!profile || !profile.isActive) {
    return NextResponse.json({ ok: false, error: 'Connect profile not found.' }, { status: 404 });
  }

  const url = `${process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '') || 'https://ea-payments.vercel.app'}/connect/${profile.slug}`;
  const vcard = [
    'BEGIN:VCARD',
    'VERSION:3.0',
    `FN:${clean(profile.brandName)}`,
    `ORG:${clean(profile.brandName)}`,
    `URL:${clean(url)}`,
    profile.ownerNotificationEmail ? `EMAIL:${clean(profile.ownerNotificationEmail)}` : '',
    profile.logoUrl ? `PHOTO;VALUE=URI:${clean(profile.logoUrl)}` : '',
    profile.subheadline ? `NOTE:${clean(profile.subheadline)}` : '',
    'END:VCARD',
  ].filter(Boolean).join('\r\n');

  return new NextResponse(vcard, {
    headers: {
      'Content-Type': 'text/vcard; charset=utf-8',
      'Content-Disposition': `attachment; filename="${profile.slug}.vcf"`,
    },
  });
}
