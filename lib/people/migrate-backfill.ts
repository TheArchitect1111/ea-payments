/**
 * Client Record → Person backfill (blueprint §8.3), gated by
 * `UNIVERSAL_PEOPLE_MIGRATE_CLIENTS`.
 *
 * Non-destructive by construction: Client Records are only read, never written or
 * deleted (INV-11). Work is checkpointed per page so a crash resumes from the last
 * processed Client Record, and the idempotent ensure path guarantees a resume cannot
 * create duplicates (ADV-P-9).
 */
import { platformQuery } from '@/lib/platform-store';
import { escapeAirtableString } from '@/lib/data/airtable-client';
import { getPeopleRepository } from '@/lib/people/adapter';
import { ensurePersonForClientRecordAsync } from '@/lib/people/ensure-person';
import { peopleValidation } from '@/lib/people/errors';
import { isUniversalPeopleEnabled, isUniversalPeopleMigrateEnabled } from '@/lib/people/flags';
import { logPeopleFailure } from '@/lib/people/redact-log';
import type { PeopleRepository } from '@/lib/people/repository';

const CLIENT_RECORDS_TABLE = 'Client Records';

export type ClientRecordSeed = {
  clientRecordId: string;
  email: string;
  clientName: string;
  portalSlug?: string;
  ctpWorkspaceRef?: string;
};

export type ClientRecordPage = {
  records: ClientRecordSeed[];
  /** `undefined` when the loader has no further pages. */
  nextCursor?: string;
};

export type ClientRecordPageLoader = (params: {
  organizationId: string;
  portalSlug?: string;
  cursor?: string;
  pageSize: number;
}) => Promise<ClientRecordPage>;

export type BackfillInput = {
  organizationId: string;
  portalSlug?: string;
  /** Stable job id so a resumed run finds its checkpoint. */
  jobId: string;
  actorEmail?: string;
  dryRun?: boolean;
  pageSize?: number;
  maxPages?: number;
  loader?: ClientRecordPageLoader;
  repository?: PeopleRepository;
};

export type BackfillResult = {
  ok: boolean;
  jobId: string;
  organizationId: string;
  processed: number;
  created: number;
  linked: number;
  skipped: number;
  dryRun: boolean;
  lastClientRecordId?: string;
  error?: string;
};

/**
 * Read-only Airtable loader. Ordering is by the Client Records `Created At` column
 * when present; the cursor is the last processed Client Record id and rows up to and
 * including it are skipped on resume. Because ensure is idempotent, a coarse cursor
 * costs extra reads but can never duplicate a Person.
 */
export function airtableClientRecordLoader(): ClientRecordPageLoader {
  return async ({ organizationId, portalSlug, cursor, pageSize }) => {
    const clauses = [`{Organization Id}='${escapeAirtableString(organizationId)}'`];
    if (portalSlug) clauses.push(`{Portal Slug}='${escapeAirtableString(portalSlug)}'`);
    const filter = clauses.length > 1 ? `AND(${clauses.join(',')})` : clauses[0];

    const records = await platformQuery(CLIENT_RECORDS_TABLE, filter, Math.min(pageSize * 4, 400));
    const seeds: ClientRecordSeed[] = records
      .map((record) => ({
        clientRecordId: record.id,
        email: String(record.fields['Email'] ?? record.fields['Client Email'] ?? '').trim(),
        clientName: String(record.fields['Client Name'] ?? record.fields['Name'] ?? '').trim(),
        portalSlug: String(record.fields['Portal Slug'] ?? portalSlug ?? '').trim() || undefined,
      }))
      .filter((seed) => Boolean(seed.email));

    const startIndex = cursor ? seeds.findIndex((s) => s.clientRecordId === cursor) + 1 : 0;
    const page = seeds.slice(startIndex, startIndex + pageSize);
    const consumed = startIndex + page.length;
    return {
      records: page,
      nextCursor: consumed < seeds.length ? page[page.length - 1]?.clientRecordId : undefined,
    };
  };
}

export async function runPeopleClientBackfill(input: BackfillInput): Promise<BackfillResult> {
  const base: BackfillResult = {
    ok: false,
    jobId: input.jobId,
    organizationId: input.organizationId,
    processed: 0,
    created: 0,
    linked: 0,
    skipped: 0,
    dryRun: Boolean(input.dryRun),
  };

  if (!isUniversalPeopleEnabled()) {
    return { ...base, ok: true, error: 'people_flag_off' };
  }
  if (!isUniversalPeopleMigrateEnabled()) {
    return { ...base, ok: true, error: 'migrate_flag_off' };
  }
  if (!input.organizationId?.trim()) throw peopleValidation('organizationId required');

  const repo = input.repository || getPeopleRepository();
  const loader = input.loader || airtableClientRecordLoader();
  const pageSize = Math.min(Math.max(input.pageSize ?? 25, 1), 100);
  const maxPages = Math.min(Math.max(input.maxPages ?? 20, 1), 200);

  const checkpoint = await repo.getMigrationCheckpoint(input.organizationId, input.jobId);
  let cursor = checkpoint?.lastClientRecordId;
  let processed = checkpoint?.processed ?? 0;
  let created = checkpoint?.created ?? 0;
  let linked = checkpoint?.linked ?? 0;
  let skipped = 0;

  try {
    for (let page = 0; page < maxPages; page += 1) {
      const { records, nextCursor } = await loader({
        organizationId: input.organizationId,
        portalSlug: input.portalSlug,
        cursor,
        pageSize,
      });
      if (records.length === 0) break;

      for (const seed of records) {
        const existing = await repo.findPersonByExternalId(
          input.organizationId,
          'client-record',
          seed.clientRecordId,
        );

        if (input.dryRun) {
          processed += 1;
          if (existing) linked += 1;
          else created += 1;
          cursor = seed.clientRecordId;
          continue;
        }

        const person = await ensurePersonForClientRecordAsync(
          {
            organizationId: input.organizationId,
            portalSlug: seed.portalSlug || input.portalSlug,
            clientRecordId: seed.clientRecordId,
            email: seed.email,
            displayName: seed.clientName || seed.email,
            source: 'client-record-migration',
            ctpWorkspaceRef: seed.ctpWorkspaceRef,
            actorEmail: input.actorEmail,
          },
          repo,
        );

        processed += 1;
        if (!person) skipped += 1;
        else if (existing) linked += 1;
        else created += 1;
        cursor = seed.clientRecordId;

        // Checkpoint after every row so a crash resumes without re-work loss (§8.3).
        await repo.saveMigrationCheckpoint({
          organizationId: input.organizationId,
          jobId: input.jobId,
          lastClientRecordId: cursor,
          processed,
          created,
          linked,
          status: 'running',
        });
      }

      if (!nextCursor) break;
      cursor = nextCursor;
    }

    if (!input.dryRun) {
      await repo.saveMigrationCheckpoint({
        organizationId: input.organizationId,
        jobId: input.jobId,
        lastClientRecordId: cursor,
        processed,
        created,
        linked,
        status: 'completed',
      });
      await repo.appendAudit({
        organizationId: input.organizationId,
        actorEmail: input.actorEmail || 'system',
        action: 'people.import',
        meta: { jobId: input.jobId, processed, created, linked, source: 'client-record-backfill' },
      });
    }

    return {
      ...base,
      ok: true,
      processed,
      created,
      linked,
      skipped,
      lastClientRecordId: cursor,
    };
  } catch (error) {
    logPeopleFailure('client_backfill', error, {
      organizationId: input.organizationId,
      jobId: input.jobId,
      processed,
    });
    if (!input.dryRun) {
      await repo
        .saveMigrationCheckpoint({
          organizationId: input.organizationId,
          jobId: input.jobId,
          lastClientRecordId: cursor,
          processed,
          created,
          linked,
          status: 'failed',
        })
        .catch(() => undefined);
    }
    return {
      ...base,
      ok: false,
      processed,
      created,
      linked,
      skipped,
      lastClientRecordId: cursor,
      error: error instanceof Error ? error.message : 'backfill failed',
    };
  }
}
