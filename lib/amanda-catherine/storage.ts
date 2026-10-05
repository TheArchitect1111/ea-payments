import { createRecord } from './airtable';

type AirtableRecord = { id?: string; [key: string]: any };
type FieldFallback = { from: string; to: string; error: string };
type SafeCreateResult =
  | { success: true; record: AirtableRecord; fallback: FieldFallback | null }
  | {
      success: false;
      error: string;
      initialError?: string;
      fallback?: Omit<FieldFallback, 'error'>;
    };

type AmandaWriteResult = {
  success: boolean;
  error: string | null;
  table: string;
  recordId: string | null;
  initialError?: string;
  fallback?: Omit<FieldFallback, 'error'>;
};

function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

const safeCreate = async (
  tableName: string,
  fields: Record<string, any>,
): Promise<SafeCreateResult> => {
  try {
    return {
      success: true,
      record: await createRecord(tableName, fields),
      fallback: null,
    };
  } catch (error: unknown) {
    const initialError = errorMessage(error);
    if (!initialError.includes('Unknown field name')) {
      return { success: false, error: initialError };
    }

    const courseFieldError = /Unknown field name ["']?Course["']?/i.test(initialError);
    const offerFieldError = /Unknown field name ["']?Offer["']?/i.test(initialError);
    const from = courseFieldError ? 'Course' : offerFieldError ? 'Offer' : null;
    const to = courseFieldError
      ? 'Course interested in'
      : offerFieldError
        ? 'Course'
        : null;

    if (!from || !to || !(from in fields)) {
      return { success: false, error: initialError };
    }

    const retryFields = { ...fields, [to]: fields[from] };
    delete retryFields[from];

    try {
      return {
        success: true,
        record: await createRecord(tableName, retryFields),
        fallback: { from, to, error: initialError },
      };
    } catch (retryError: unknown) {
      return {
        success: false,
        error: errorMessage(retryError),
        initialError,
        fallback: { from, to },
      };
    }
  }
};

async function writeRecord(
  table: string,
  fields: Record<string, any>,
): Promise<AmandaWriteResult> {
  const result = await safeCreate(table, fields);
  if (!result.success) {
    return {
      success: false,
      error: result.error,
      table,
      recordId: null,
      ...(result.initialError ? { initialError: result.initialError } : {}),
      ...(result.fallback ? { fallback: result.fallback } : {}),
    };
  }

  return {
    success: true,
    error: null,
    table,
    recordId: result.record?.id ?? null,
    ...(result.fallback
      ? {
          initialError: result.fallback.error,
          fallback: { from: result.fallback.from, to: result.fallback.to },
        }
      : {}),
  };
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
