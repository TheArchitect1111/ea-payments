import { NextRequest, NextResponse } from 'next/server';
import { createAmandaLead, ensureClientRecord } from '@/lib/amanda-catherine/airtable';
import type { AmandaSubmissionType } from '@/lib/amanda-catherine/storage';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { audience, formId, courseId, source, name, email, phone, amount, fields, type } = body;

    if (!email) return NextResponse.json({ error: 'Email required' }, { status: 400 });

    // Determine storage type based on formId/courseId - preserves mapping
    let storageType: AmandaSubmissionType = type || 'application';
    if (formId === 'waitlist' || source?.includes('waitlist')) storageType = 'waitlist';
    else if (formId?.includes('kit') || formId?.includes('purchase') || amount) storageType = 'payment';
    else if (['client-intake-consent'].includes(formId)) storageType = 'client-access';
    else storageType = 'application';

    const payload = {
      type: storageType,
      audience: audience || 'student-trainee',
      formId,
      courseId,
      source: source || 'amandacatherine.ca',
      name: name || email,
      email,
      phone,
      amount,
      fields: fields || {},
    };

    const result = await createAmandaLead(payload);

    // Preserve Client Records integration for identity/access
    let clientRecordResult = null;
    if (['client','student-trainee','certified-practitioner'].includes(audience)) {
      clientRecordResult = await ensureClientRecord(payload);
    }

    console.log('AMANDA_SUBMIT', { storageType, audience, formId, courseId, email, table: (result as any).table });

    return NextResponse.json({
      success: !!(result as any).success,
      storageType,
      primary: result,
      clientRecord: clientRecordResult,
      next: `/portal/amanda-catherine/thank-you?audience=${audience}&type=${storageType}&form=${formId || ''}&course=${courseId || ''}`
    });
  } catch (e: any) {
    return NextResponse.json({ error: e.message, stack: e.stack }, { status: 500 });
  }
}
