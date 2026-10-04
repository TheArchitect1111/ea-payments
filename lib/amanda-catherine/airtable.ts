const BASE_ID = process.env.AIRTABLE_AMANDA_BASE_ID || process.env.AIRTABLE_PAYMENTS_BASE_ID!;
const KEY = process.env.AIRTABLE_API_KEY!;

export async function createAmandaLead(data: any) {
  if (!KEY || !BASE_ID) return { error: 'Missing Airtable env' };
  
  // Uses your existing Client Records + new tables - Amanda can track in same base
  const fields: any = {
    clientName: data.name || data.email,
    email: data.email,
    organization: `${data.audience} | ${data.formId || data.courseId} | ${data.source}`,
    packagePurchased: 'Capacity Assessment', // repurpose for Amanda tracking
    amountPaid: data.amount || 0,
    paymentDate: new Date().toISOString(),
    stripeTransactionId: `amanda-${data.formId||data.courseId}-${Date.now()}`,
    portalAccessStatus: 'Pending',
    onboardingStatus: 'Not Started',
    // Amanda-specific (add these fields to Airtable or use notes)
    _amanda_audience: data.audience,
    _amanda_form: data.formId,
    _amanda_course: data.courseId,
    _amanda_stage: 'new',
    _amanda_fields: JSON.stringify(data.fields),
  };

  const res = await fetch(`https://api.airtable.com/v0/${BASE_ID}/${process.env.AIRTABLE_CLIENT_RECORDS_TABLE_ID || 'Client Records'}`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ fields })
  });
  return res.json();
}
