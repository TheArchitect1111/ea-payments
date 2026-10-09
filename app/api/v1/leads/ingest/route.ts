import { timingSafeEqual } from 'node:crypto';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { airtableUpsertByField } from '@/lib/data/airtable-client';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const LeadSchema = z.object({
  first_name: z.string().trim().min(1).max(80),
  last_name: z.string().trim().max(80).default(''),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).default(''),
  class_name: z.string().trim().min(1).max(200),
  class_id: z.string().trim().min(1).max(120),
  registration_type: z.enum(['live', 'waitlist']),
  created_at: z.string().datetime().optional(),
  source_page: z.literal('amandacatherine.ca'),
});

function authorized(req: NextRequest) {
  const ingestKey = process.env.INGEST_API_KEY?.trim();
  const trackingKey = process.env.TRACKING_PORTAL_API_KEY?.trim();
  const expected = ingestKey || trackingKey || '';
  console.info('[lead-ingest] authorization key source', ingestKey ? 'INGEST_API_KEY' : trackingKey ? 'TRACKING_PORTAL_API_KEY' : 'none');
  const received = req.headers.get('x-api-key') || '';
  if (!expected || !received) return false;
  const left = Buffer.from(expected);
  const right = Buffer.from(received);
  return left.length === right.length && timingSafeEqual(left, right);
}

export async function POST(req: NextRequest) {
  if (!authorized(req)) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });
  const parsed = LeadSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ ok: false, error: 'Invalid lead payload' }, { status: 400 });
  const lead = parsed.data;
  const registration_key = `${lead.email.toLowerCase()}:${lead.class_id}`;
  const saved = await airtableUpsertByField('portal_registrations', 'registration_key', registration_key, {
    registration_key,
    first_name: lead.first_name,
    last_name: lead.last_name,
    email: lead.email.toLowerCase(),
    phone: lead.phone,
    class_name: lead.class_name,
    class_id: lead.class_id,
    registration_type: lead.registration_type,
    created_at: lead.created_at || new Date().toISOString(),
    source_page: 'amandacatherine.ca',
  });
  if (!saved) return NextResponse.json({ ok: false, error: 'Registration tracking is unavailable' }, { status: 503 });
  return NextResponse.json({ ok: true, id: saved.id, registration_type: lead.registration_type }, { headers: { 'Cache-Control': 'no-store' } });
}
