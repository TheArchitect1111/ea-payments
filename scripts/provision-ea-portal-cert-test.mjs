/**
 * Provision dedicated non-billable production cert tenant:
 *   "EA Portal Certification Test" → slug ea-portal-cert-test
 *
 * Reuses the same Airtable shape as ensureDemoWebsitePortal /
 * ensureCtpWorkspaceForWebsitePortal — without Stripe, Resend, or site publish.
 *
 * Usage:
 *   node scripts/provision-ea-portal-cert-test.mjs [.env.local]
 *
 * Idempotent on Email + Portal Slug. Does not alter unrelated clients.
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, '..');

const envPath =
  process.argv[2] && !process.argv[2].startsWith('--')
    ? path.resolve(process.argv[2])
    : path.join(ROOT, '.env.local');

function loadEnvFile(filePath) {
  try {
    return Object.fromEntries(
      fs
        .readFileSync(filePath, 'utf8')
        .split(/\r?\n/)
        .filter((line) => line && !line.trim().startsWith('#'))
        .map((line) => {
          const i = line.indexOf('=');
          if (i < 0) return null;
          let value = line.slice(i + 1).trim();
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          return [line.slice(0, i).trim(), value];
        })
        .filter(Boolean),
    );
  } catch {
    return {};
  }
}

const env = { ...loadEnvFile(envPath), ...process.env };
const key = (env.AIRTABLE_API_KEY || env.AIRTABLE_PAT || '').trim();
const baseId = (env.AIRTABLE_PAYMENTS_BASE_ID || 'appv0YoLIMY45fmDA').trim();
const clientTable = 'Client Records';
const ctpTable = (env.AIRTABLE_CTP_SUBMISSIONS_TABLE || 'CTP Submissions').trim();
const platformBaseId = (env.AIRTABLE_PLATFORM_BASE_ID || baseId).trim();
const orgTable = 'Organizations';
const entitlementsTable = 'Entitlements';

const CERT = {
  clientName: 'EA Portal Certification Test',
  organization: 'EA Portal Certification Test',
  email: 'ea-portal-cert-test@efficiencyarchitects.online',
  slug: 'ea-portal-cert-test',
  password: 'EaPortalCert2026!',
  packagePurchased: 'Website + Portal Starter',
  commerceOfferId: 'website_portal_starter',
  amountPaid: 0,
  stripeTransactionId: 'cert_audit_non_billable_ea_portal',
  proposalId: 'WPS-ea-portal-cert-test',
  assessmentId: 'WPS-ASSESS-ea-portal-cert-test',
};

if (!key) {
  console.error('Missing AIRTABLE_API_KEY / AIRTABLE_PAT.');
  console.error(`Tried env file: ${envPath}`);
  process.exit(1);
}

function headers() {
  return {
    Authorization: `Bearer ${key}`,
    'Content-Type': 'application/json',
  };
}

async function airtable(method, table, opts = {}) {
  const { recordId, query, body, base = baseId } = opts;
  let url = `https://api.airtable.com/v0/${base}/${encodeURIComponent(table)}`;
  if (recordId) url += `/${recordId}`;
  if (query) url += `?${query}`;
  const res = await fetch(url, {
    method,
    headers: headers(),
    body: body ? JSON.stringify(body) : undefined,
    cache: 'no-store',
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text };
  }
  if (!res.ok) {
    const err = new Error(`Airtable ${method} ${table} → ${res.status}: ${text.slice(0, 500)}`);
    err.status = res.status;
    err.body = json;
    throw err;
  }
  return json;
}

async function findClientByEmailOrSlug() {
  const email = CERT.email.replace(/'/g, "\\'");
  const slug = CERT.slug.replace(/'/g, "\\'");
  const formula = encodeURIComponent(
    `OR(LOWER({Email})='${email}', {Portal Slug}='${slug}')`,
  );
  const data = await airtable('GET', clientTable, {
    query: `filterByFormula=${formula}&maxRecords=2`,
  });
  return data.records || [];
}

async function upsertClient() {
  const existing = await findClientByEmailOrSlug();
  if (existing.length > 1) {
    throw new Error(
      `Ambiguous Client Records for cert tenant (${existing.length} matches). Aborting to avoid altering wrong rows.`,
    );
  }
  const today = new Date().toISOString().slice(0, 10);
  const fields = {
    'Client Name': CERT.clientName,
    Organization: CERT.organization,
    Email: CERT.email,
    'Package Purchased': CERT.packagePurchased,
    'Commerce Offer Id': CERT.commerceOfferId,
    'Amount Paid': CERT.amountPaid,
    'Payment Date': today,
    'Stripe Transaction ID': CERT.stripeTransactionId,
    'Portal Access Status': 'Active',
    'Onboarding Status': 'In Progress',
    'Portal Username': CERT.email,
    'Portal Slug': CERT.slug,
    'Temp Password': CERT.password,
    'Password Changed': false,
  };

  if (existing[0]) {
    let patched;
    try {
      patched = await airtable('PATCH', clientTable, {
        recordId: existing[0].id,
        body: { fields, typecast: true },
      });
    } catch (err) {
      if (/Commerce Offer Id|UNKNOWN_FIELD/i.test(String(err.message))) {
        const { 'Commerce Offer Id': _omit, ...rest } = fields;
        patched = await airtable('PATCH', clientTable, {
          recordId: existing[0].id,
          body: { fields: rest, typecast: true },
        });
      } else {
        throw err;
      }
    }
    return { recordId: existing[0].id, created: false, fields: patched.fields || fields };
  }

  let created;
  try {
    created = await airtable('POST', clientTable, {
      body: { records: [{ fields }], typecast: true },
    });
  } catch (err) {
    if (/Commerce Offer Id|UNKNOWN_FIELD/i.test(String(err.message))) {
      const { 'Commerce Offer Id': _omit, ...rest } = fields;
      created = await airtable('POST', clientTable, {
        body: { records: [{ fields: rest }], typecast: true },
      });
    } else {
      throw err;
    }
  }
  const rec = created.records?.[0];
  if (!rec?.id) throw new Error('Client Records create returned no id');
  return { recordId: rec.id, created: true, fields: rec.fields || fields };
}

async function findCtpByProposalOrSlug() {
  const proposal = CERT.proposalId.replace(/'/g, "\\'");
  const slug = CERT.slug.replace(/'/g, "\\'");
  const formula = encodeURIComponent(
    `OR({Proposal ID}='${proposal}', {Portal Slug}='${slug}')`,
  );
  const data = await airtable('GET', ctpTable, {
    query: `filterByFormula=${formula}&maxRecords=2`,
  });
  return data.records || [];
}

async function upsertCtp(clientRecordId) {
  const existing = await findCtpByProposalOrSlug();
  if (existing.length > 1) {
    throw new Error(
      `Ambiguous CTP Submissions for cert tenant (${existing.length} matches). Aborting.`,
    );
  }

  const now = new Date().toISOString();
  const submissionId =
    existing[0]?.fields?.['Submission ID'] ||
    `ctp_cert_${crypto.randomBytes(6).toString('hex')}`;

  const payload = {
    discoveryAnswers: {
      source: 'website_portal_starter',
      provisionedVia: 'provision-ea-portal-cert-test',
      nonBillable: true,
      auditPurpose: 'Pass 1 authenticated runtime',
      clientRecordId,
    },
    clientType: 'website_portal',
    projectEvidence: ['portal.bound', 'discovery.complete'],
  };

  const fields = {
    'Submission ID': submissionId,
    'Business Name': CERT.organization,
    'Contact Name': CERT.clientName,
    Email: CERT.email,
    Status: 'Workspace Active',
    'Workspace Status': 'Active',
    'Studio Status': 'Not Started',
    'Portal Slug': CERT.slug,
    'Assessment ID': CERT.assessmentId,
    'Proposal ID': CERT.proposalId,
    'Payload JSON': JSON.stringify(payload),
    'Submitted At': existing[0]?.fields?.['Submitted At'] || now,
    'Updated At': now,
  };

  if (existing[0]) {
    await airtable('PATCH', ctpTable, {
      recordId: existing[0].id,
      body: { fields, typecast: true },
    });
    return {
      airtableRecordId: existing[0].id,
      submissionId,
      created: false,
    };
  }

  const created = await airtable('POST', ctpTable, {
    body: { records: [{ fields }], typecast: true },
  });
  const rec = created.records?.[0];
  if (!rec?.id) throw new Error('CTP Submissions create returned no id');
  return { airtableRecordId: rec.id, submissionId, created: true };
}

async function upsertOrganization(clientRecordId) {
  const slug = CERT.slug.replace(/'/g, "\\'");
  try {
    const data = await airtable('GET', orgTable, {
      base: platformBaseId,
      query: `filterByFormula=${encodeURIComponent(`{Portal Slug}='${slug}'`)}&maxRecords=1`,
    });
    const existing = data.records?.[0];
    const fields = {
      Name: CERT.organization,
      Slug: CERT.slug,
      Status: 'Active',
      'Portal Slug': CERT.slug,
      'Client Record Id': clientRecordId,
      'Workspace Name': CERT.organization,
    };
    if (existing) {
      await airtable('PATCH', orgTable, {
        base: platformBaseId,
        recordId: existing.id,
        body: { fields, typecast: true },
      });
      return { recordId: existing.id, created: false, skipped: false };
    }
    const created = await airtable('POST', orgTable, {
      base: platformBaseId,
      body: { records: [{ fields }], typecast: true },
    });
    return {
      recordId: created.records?.[0]?.id || null,
      created: true,
      skipped: false,
    };
  } catch (err) {
    return {
      recordId: null,
      created: false,
      skipped: true,
      error: String(err.message || err).slice(0, 400),
    };
  }
}

async function ensureCtpEntitlement(orgRecordId) {
  if (!orgRecordId) return { skipped: true, reason: 'no org id' };
  try {
    const formula = encodeURIComponent(
      `AND({Organization Id}='${orgRecordId.replace(/'/g, "\\'")}', {Module Id}='ctp')`,
    );
    const data = await airtable('GET', entitlementsTable, {
      base: platformBaseId,
      query: `filterByFormula=${formula}&maxRecords=1`,
    });
    if (data.records?.[0]) {
      return { recordId: data.records[0].id, created: false, skipped: false };
    }
    const fields = {
      'Organization Id': orgRecordId,
      'Module Id': 'ctp',
      Status: 'Active',
      'Portal Slug': CERT.slug,
    };
    const created = await airtable('POST', entitlementsTable, {
      base: platformBaseId,
      body: { records: [{ fields }], typecast: true },
    });
    return {
      recordId: created.records?.[0]?.id || null,
      created: true,
      skipped: false,
    };
  } catch (err) {
    return {
      skipped: true,
      error: String(err.message || err).slice(0, 400),
    };
  }
}

async function main() {
  console.log('Provisioning EA Portal Certification Test…');
  console.log(`Env file: ${envPath}`);
  console.log(`Payments base: ${baseId}`);

  const client = await upsertClient();
  console.log(`Client Records: ${client.created ? 'created' : 'updated'} ${client.recordId}`);

  const ctp = await upsertCtp(client.recordId);
  console.log(
    `CTP Submissions: ${ctp.created ? 'created' : 'updated'} ${ctp.airtableRecordId} (${ctp.submissionId})`,
  );

  const org = await upsertOrganization(client.recordId);
  if (org.skipped) {
    console.log(`Organizations: skipped (${org.error || 'n/a'}) — login may synthesize org`);
  } else {
    console.log(`Organizations: ${org.created ? 'created' : 'updated'} ${org.recordId}`);
  }

  const ent = await ensureCtpEntitlement(org.recordId);
  if (ent.skipped) {
    console.log(`Entitlements: skipped (${ent.error || ent.reason || 'n/a'})`);
  } else {
    console.log(`Entitlements(ctp): ${ent.created ? 'created' : 'reused'} ${ent.recordId}`);
  }

  const inventory = {
    purpose: 'Pass 1 authenticated runtime — dedicated non-billable cert tenant',
    provisionedAt: new Date().toISOString(),
    provisionScript: 'scripts/provision-ea-portal-cert-test.mjs',
    nonBillable: true,
    didNot: [
      'stripe_charge',
      'resend_email',
      'sms',
      'website_publish',
      'demo-enter',
      'alter_unrelated_clients',
    ],
    identity: {
      clientName: CERT.clientName,
      organization: CERT.organization,
      email: CERT.email,
      portalSlug: CERT.slug,
      tempPassword: CERT.password,
      passwordChanged: false,
      packagePurchased: CERT.packagePurchased,
      commerceOfferId: CERT.commerceOfferId,
      amountPaid: CERT.amountPaid,
      stripeTransactionId: CERT.stripeTransactionId,
      proposalId: CERT.proposalId,
      assessmentId: CERT.assessmentId,
    },
    records: {
      clientRecords: {
        table: clientTable,
        baseId,
        recordId: client.recordId,
        created: client.created,
      },
      ctpSubmissions: {
        table: ctpTable,
        baseId,
        airtableRecordId: ctp.airtableRecordId,
        submissionId: ctp.submissionId,
        created: ctp.created,
      },
      organizations: {
        table: orgTable,
        baseId: platformBaseId,
        recordId: org.recordId,
        created: org.created,
        skipped: org.skipped,
        error: org.error || null,
      },
      entitlements: {
        table: entitlementsTable,
        baseId: platformBaseId,
        recordId: ent.recordId || null,
        created: ent.created || false,
        skipped: Boolean(ent.skipped),
        error: ent.error || null,
      },
    },
    signIn: {
      portalLoginUrl: `https://efficiencyarchitects.online/portal/login?next=${encodeURIComponent(`/portal/${CERT.slug}/ctp/progress`)}`,
      passwordLoginAction:
        'Open portal login → "Sign in with password instead" → email + temp password. If production portal 2FA is enabled, this path sends a code email to the cert inbox (EA-owned). Prefer admin enter to avoid mail.',
      adminEnterUrl: `https://efficiencyarchitects.online/api/admin/show/enter?slug=${encodeURIComponent(CERT.slug)}`,
      adminEnterRequires: 'Existing admin session with admin:manage; no client email sent',
      postLoginHome: `https://efficiencyarchitects.online/portal/${CERT.slug}/ctp/progress`,
      adminEnterLandsOn: `https://efficiencyarchitects.online/portal/${CERT.slug}/ctp`,
    },
    removalHints: [
      `Delete Client Records row ${client.recordId}`,
      `Delete CTP Submissions row ${ctp.airtableRecordId} (Submission ID ${ctp.submissionId})`,
      org.recordId ? `Delete Organizations row ${org.recordId}` : 'No Organizations row to delete',
      ent.recordId ? `Delete Entitlements row ${ent.recordId}` : 'No Entitlements row to delete',
    ],
  };

  const outDir = path.join(ROOT, 'docs', 'audits');
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, 'EA-PORTAL-CERT-TEST-TENANT.json');
  fs.writeFileSync(outPath, JSON.stringify(inventory, null, 2), 'utf8');
  console.log(`Inventory written: ${outPath}`);
  console.log('\nDONE — do not begin authenticated testing in this step.');
  console.log(`Sign-in URL: ${inventory.signIn.portalLoginUrl}`);
  console.log(`Admin enter (no client email): ${inventory.signIn.adminEnterUrl}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
