import { createRecord } from './airtable';

type AmandaWriteResult = {
  success: boolean;
  error: string | null;
  table: string;
  recordId: string | null;
};

async function writeRecord(
  table: string,
  fields: Record<string, any>,
): Promise<AmandaWriteResult> {
  try {
    const record = await createRecord(table, fields);
    return {
      success: true,
      error: null,
      table,
      recordId: record?.id ?? null,
    };
  } catch (error: unknown) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      table,
      recordId: null,
    };
  }
}

export async function handleAmandaSubmit(p: any): Promise<AmandaWriteResult[]> {
  const writes: Promise<AmandaWriteResult>[] = [
    writeRecord('Portal Form Submissions', {
      Email: p.email,
      Name: p.name,
      Phone: p.phone,
      Type: p.type,
      Course: p.courseId,
      FormId: p.formId,
      Created: new Date().toISOString(),
    }),
  ];

  if (p.type === 'enroll' || p.type === 'kit') {
    writes.push(
      writeRecord('Client Records', {
        Email: p.email,
        Name: p.name,
        Status: 'Active Enrolled',
        Course: p.courseId,
      }),
      writeRecord('Creative Studio', {
        Email: p.email,
        Offer: p.courseId,
        Type: p.type,
      }),
    );
  }

  if (p.type === 'waitlist') {
    writes.push(
      writeRecord('amanda_waitlist', {
        Email: p.email,
        Name: p.name,
        Course: p.courseId,
      }),
    );
  }

  return Promise.all(writes);
}
