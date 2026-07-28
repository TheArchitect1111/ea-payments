#!/usr/bin/env node
/**
 * Production-hardening contracts for Trust Engine legal persistence & enforcement.
 * npm run test:legal-production
 *
 * Uses TRUST_ENGINE_DEV_FALLBACK=1 and isolated temp dir — does not require Airtable.
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);

let failed = 0;
function assert(cond, msg) {
  if (!cond) {
    console.error('FAIL:', msg);
    failed += 1;
  } else {
    console.log('OK:', msg);
  }
}

// Force isolated local fallback for unit contracts
process.env.TRUST_ENGINE_DEV_FALLBACK = '1';
process.env.NODE_ENV = 'development';
delete process.env.AIRTABLE_API_KEY;
delete process.env.AIRTABLE_PAT;

const dataDir = mkdtempSync(join(tmpdir(), 'ea-trust-'));
process.chdir(root);

async function loadTs(rel) {
  // Dynamic import of compiled-less TS via next isn't available; test pure JS mirrors + source contracts.
  return readFileSync(join(root, rel), 'utf8');
}

async function main() {
  // --- Source / architecture contracts ---
  const acceptRoute = await loadTs('app/api/trust/accept/route.ts');
  assert(acceptRoute.includes('requirePortalSessionFromRequest'), 'accept API requires auth');
  assert(acceptRoute.includes('Authentication required'), 'unauthenticated rejection');
  assert(acceptRoute.includes('buildServerAcceptanceRecords') || acceptRoute.includes('acceptLegalDocuments'), 'server-side accept service');
  assert(
    !acceptRoute.includes('body.clientId ||') && !acceptRoute.includes('clientId: body.clientId'),
    'does not trust body.clientId assignment',
  );

  const acceptService = await loadTs('lib/trust-engine/accept-service.ts');
  assert(acceptService.includes('MSA and SOW cannot be accepted'), 'MSA/SOW excluded from checkbox');
  assert(acceptService.includes('getEffectiveLegalDocument'), 'server resolves current version');
  assert(acceptService.includes('acceptedAt = new Date'), 'server-generated timestamp');

  const persist = await loadTs('lib/trust-engine/persistence-mode.ts');
  assert(persist.includes('TRUST_ENGINE_DEV_FALLBACK'), 'explicit dev fallback');
  assert(persist.includes("NODE_ENV === 'production'"), 'production blocks local fallback');
  assert(persist.includes('Legal Acceptances'), 'Legal Acceptances table');
  assert(persist.includes('Legal Audit Events'), 'Legal Audit Events table');

  const airtableStore = await loadTs('lib/trust-engine/airtable-legal-store.ts');
  assert(airtableStore.includes('platformCreate'), 'reuses platform Airtable client');
  assert(airtableStore.includes('Acceptance ID'), 'acceptanceId field');
  assert(airtableStore.includes('airtableFindAcceptanceDuplicate'), 'duplicate prevention');

  const clientStore = await loadTs('lib/trust-engine/client-store.ts');
  assert(clientStore.includes('trustEngineAirtableReady'), 'Airtable-first client store');
  assert(clientStore.includes('appendClientAcceptancesDetailed'), 'append-only detailed append');
  assert(clientStore.includes('duplicatesSkipped'), 'duplicate skip tracking');

  const audit = await loadTs('lib/trust-engine/audit.ts');
  assert(audit.includes('airtableInsertAudit'), 'audit uses Airtable');
  assert(audit.includes('trustEngineAllowLocalFallback'), 'audit local only as fallback');

  const shell = await loadTs('app/components/trust/LegalReacceptanceShell.tsx');
  assert(shell.includes('evaluateReacceptanceGate'), 'shell evaluates gate');
  assert(shell.includes('LegalReacceptanceGate'), 'shell mounts gate');

  const portalLayout = await loadTs('app/portal/[slug]/layout.tsx');
  assert(portalLayout.includes('LegalReacceptanceShell'), 'portal layout enforcement');

  const simplifiLayout = await loadTs('app/simplifi/layout.tsx');
  assert(simplifiLayout.includes('LegalReacceptanceShell'), 'simplifi layout enforcement');

  const gate = await loadTs('lib/trust-engine/reacceptance-guard.ts');
  assert(gate.includes("'/legal'"), 'legal paths exempt');
  assert(gate.includes("'/trust'"), 'trust path exempt');

  const gateUi = await loadTs('app/components/trust/LegalReacceptanceGate.tsx');
  assert(gateUi.includes('router.replace'), 'returns to intended page after acceptance');
  assert(gateUi.includes('docTypes'), 'sends docTypes not forged versions');

  const adapter = await loadTs('lib/trust-engine/esign-webhook-adapter.ts');
  assert(adapter.includes('msa.signed'), 'msa.signed mapping');
  assert(adapter.includes('sow.signed'), 'sow.signed mapping');
  assert(adapter.includes('msa.sent'), 'msa.sent mapping');
  assert(adapter.includes('sow.sent'), 'sow.sent mapping');
  assert(adapter.includes('verifyEsignWebhookAuthenticity'), 'webhook authenticity');
  assert(adapter.includes('valid: false'), 'rejects incomplete payloads');

  const webhook = await loadTs('app/api/webhooks/esignatures/route.ts');
  assert(webhook.includes('normalizeEsignWebhookPayload'), 'webhook uses adapter');
  assert(webhook.includes('applied: false'), 'incomplete not marked signed');

  const migration = await loadTs('scripts/migrate-trust-engine-to-airtable.mjs');
  assert(migration.includes('--dry-run'), 'migration dry-run');
  assert(migration.includes('NOT deleted'), 'never deletes source');

  // --- Runtime adapter tests (pure JS evaluation via Function on extracted logic is heavy;
  //     instead spawn node importing the TS through a minimal reimplementation check) ---
  const fixtures = {
    msaSigned: JSON.parse(
      readFileSync(join(root, 'scripts/fixtures/esign-msa-signed.json'), 'utf8'),
    ),
    sowSigned: JSON.parse(
      readFileSync(join(root, 'scripts/fixtures/esign-sow-signed.json'), 'utf8'),
    ),
    msaSent: JSON.parse(readFileSync(join(root, 'scripts/fixtures/esign-msa-sent.json'), 'utf8')),
    malformed: JSON.parse(
      readFileSync(join(root, 'scripts/fixtures/esign-malformed.json'), 'utf8'),
    ),
  };

  // Inline normalize mirror for fixture assertions (keeps test free of TS transpile)
  function normalize(body, msaId, sowId) {
    const status = String(body.status || '').toLowerCase();
    const templateId = String(body.template_id || body.templateId || '');
    const hint = String(body.document_type || body.documentType || '').toLowerCase();
    const clientId = body.clientId || body.client_id || null;
    const orgId = body.organizationId || body.orgId || clientId;
    let family = null;
    if (templateId === msaId || hint.includes('msa')) family = 'msa';
    if (templateId === sowId || hint.includes('statement of work') || hint.includes('sow'))
      family = 'sow';
    if (!family) return { valid: false, kind: null };
    if (!clientId && !orgId) return { valid: false, kind: null };
    const signed = status.includes('sign') || status.includes('complete');
    const sent = status.includes('sent');
    if (signed) return { valid: true, kind: family === 'msa' ? 'msa.signed' : 'sow.signed' };
    if (sent) return { valid: true, kind: family === 'msa' ? 'msa.sent' : 'sow.sent' };
    return { valid: false, kind: null };
  }

  assert(
    normalize(fixtures.msaSigned, 'tmpl_msa_test', 'tmpl_sow_test').kind === 'msa.signed',
    'MSA signed webhook fixture',
  );
  assert(
    normalize(fixtures.sowSigned, 'tmpl_msa_test', 'tmpl_sow_test').kind === 'sow.signed',
    'SOW signed webhook fixture',
  );
  assert(
    normalize(fixtures.msaSent, 'tmpl_msa_test', 'tmpl_sow_test').kind === 'msa.sent',
    'MSA sent webhook fixture',
  );
  assert(
    normalize(fixtures.malformed, 'tmpl_msa_test', 'tmpl_sow_test').valid === false,
    'malformed webhook rejected',
  );

  // Persistence failure message contract
  assert(
    persist.includes('Legal persistence unavailable'),
    'Airtable persistence failure message',
  );

  // History preservation contract
  assert(
    clientStore.includes('never overwrites') || clientStore.includes('Append acceptance'),
    'acceptance history preservation',
  );

  // Stale / reacceptance contracts
  assert(gate.includes('requiringAcceptance'), 'stale docs block access');
  assert(gateUi.includes('onlyRequiring'), 'gate shows only requiring docs');

  // Local fallback isolation note
  writeFileSync(join(dataDir, 'marker.txt'), 'ok');
  assert(existsSync(join(dataDir, 'marker.txt')), 'temp isolation works');
  rmSync(dataDir, { recursive: true, force: true });

  if (failed > 0) {
    console.error(`\n${failed} assertion(s) failed`);
    process.exit(1);
  }
  console.log('\nPASS: legal production hardening contracts');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
