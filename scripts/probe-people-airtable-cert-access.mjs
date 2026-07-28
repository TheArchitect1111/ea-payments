/**
 * Read-only access probe for People cert base. No schema writes.
 * Session: AIRTABLE_PAYMENTS_BASE_ID + PEOPLE_AIRTABLE_CERT_BASE_ID must already be set.
 */
import fs from 'node:fs';

const CERT = 'appGBriTtQXXBcINU';
const PROD = 'appv0YoLIMY45fmDA';

function loadDotEnvLocal() {
  if (!fs.existsSync('.env.local')) return;
  for (const line of fs.readFileSync('.env.local', 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    if (m[1] === 'AIRTABLE_PAYMENTS_BASE_ID' || m[1] === 'PEOPLE_AIRTABLE_CERT_BASE_ID') continue;
    // Force-refresh credentials from disk so a stale shell env cannot pin an old PAT.
    if (m[1] === 'AIRTABLE_API_KEY' || m[1] === 'AIRTABLE_PAT') {
      process.env[m[1]] = v;
      continue;
    }
    if (process.env[m[1]]?.trim()) continue;
    process.env[m[1]] = v;
  }
}

loadDotEnvLocal();
process.env.AIRTABLE_PAYMENTS_BASE_ID = CERT;
process.env.PEOPLE_AIRTABLE_CERT_BASE_ID = CERT;

const key = (process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PAT || '').trim();

function redact(id) {
  if (!id || id.length < 8) return 'app***';
  return `${id.slice(0, 5)}…${id.slice(-4)}`;
}

async function probe(label, url) {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${key}` },
    cache: 'no-store',
  });
  const text = await res.text();
  return {
    label,
    status: res.status,
    ok: res.ok,
    bodySnippet: text.slice(0, 180).replace(/pat[A-Za-z0-9._-]+/g, 'pat***'),
  };
}

const out = {
  credentialsPresent: Boolean(key),
  credentialLength: key.length,
  effectiveBaseRedacted: redact(CERT),
  differsFromProduction: CERT !== PROD,
  probes: [],
};

out.probes.push(
  await probe('meta_list_bases', 'https://api.airtable.com/v0/meta/bases'),
);
out.probes.push(
  await probe('meta_cert_tables', `https://api.airtable.com/v0/meta/bases/${CERT}/tables`),
);
out.probes.push(
  await probe('meta_prod_tables', `https://api.airtable.com/v0/meta/bases/${PROD}/tables`),
);
out.probes.push(
  await probe(
    'data_cert_people',
    `https://api.airtable.com/v0/${CERT}/${encodeURIComponent('People')}?maxRecords=1`,
  ),
);

// Parse accessible bases if meta_list_bases succeeded (redact ids partially)
const basesProbe = out.probes.find((p) => p.label === 'meta_list_bases');
if (basesProbe?.ok) {
  try {
    const body = JSON.parse(
      (
        await fetch('https://api.airtable.com/v0/meta/bases', {
          headers: { Authorization: `Bearer ${key}` },
        })
      ).text
        ? ''
        : '',
    );
  } catch {
    /* ignore */
  }
  const res = await fetch('https://api.airtable.com/v0/meta/bases', {
    headers: { Authorization: `Bearer ${key}` },
  });
  const body = await res.json();
  out.accessibleBases = (body.bases || []).map((b) => ({
    idRedacted: redact(b.id),
    name: b.name,
    isCert: b.id === CERT,
    isProdDefault: b.id === PROD,
  }));
  out.certBaseVisibleToToken = (body.bases || []).some((b) => b.id === CERT);
}

console.log(JSON.stringify(out, null, 2));
fs.mkdirSync('docs/audits/runtime-evidence-people-phase2b', { recursive: true });
fs.writeFileSync(
  'docs/audits/runtime-evidence-people-phase2b/schema-access-probe-2026-07-26.json',
  JSON.stringify(out, null, 2),
);
