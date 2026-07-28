/**
 * Redacted People Airtable cert preflight — prints no tokens/secrets.
 * Run: node scripts/people-airtable-cert-preflight.mjs
 */
import fs from 'node:fs';

function redactBase(id) {
  if (!id) return null;
  const t = String(id).trim();
  if (t.length < 8) return 'app***';
  return `${t.slice(0, 5)}…${t.slice(-4)}`;
}

function loadEnvFile(p) {
  const out = {};
  if (!fs.existsSync(p)) return out;
  for (const line of fs.readFileSync(p, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (!m) continue;
    let v = m[2].trim();
    if (
      (v.startsWith('"') && v.endsWith('"')) ||
      (v.startsWith("'") && v.endsWith("'"))
    ) {
      v = v.slice(1, -1);
    }
    out[m[1]] = v;
  }
  return out;
}

const files = ['.env', '.env.local', '.env.test.local', 'config/commercial-test.env'];
const fileEnv = {};
const envFilesSeen = [];
for (const p of files) {
  if (!fs.existsSync(p)) continue;
  envFilesSeen.push(p);
  Object.assign(fileEnv, loadEnvFile(p));
}

function resolve(name) {
  const fromProc = process.env[name]?.trim();
  if (fromProc) return { value: fromProc, source: 'process.env' };
  const fromFile = fileEnv[name]?.trim();
  if (fromFile) return { value: fromFile, source: 'dotenv-file' };
  return { value: '', source: 'absent' };
}

const PRODUCTION_DEFAULT = 'appv0YoLIMY45fmDA';
const base = resolve('AIRTABLE_PAYMENTS_BASE_ID');
const platformBase = resolve('AIRTABLE_PLATFORM_BASE_ID');
const peopleCertBase = resolve('PEOPLE_AIRTABLE_CERT_BASE_ID');
const peopleCertFlag = resolve('PEOPLE_AIRTABLE_CERT');
const apiKey = resolve('AIRTABLE_API_KEY');
const pat = resolve('AIRTABLE_PAT');
const cred = apiKey.value || pat.value;
const credWhich = apiKey.value ? 'AIRTABLE_API_KEY' : pat.value ? 'AIRTABLE_PAT' : null;

const effectiveBase = base.value || PRODUCTION_DEFAULT;
const matchesProductionDefault = effectiveBase === PRODUCTION_DEFAULT;
const designationHints = {
  PEOPLE_AIRTABLE_CERT_BASE_ID_set: Boolean(peopleCertBase.value),
  PEOPLE_AIRTABLE_CERT_flag: peopleCertFlag.value || null,
  baseEqualsPeopleCertBase:
    Boolean(peopleCertBase.value) && effectiveBase === peopleCertBase.value,
  baseNameContainsCertHint: /cert|test|sandbox|dev|staging/i.test(
    resolve('AIRTABLE_PEOPLE_CERT_BASE_NAME').value || '',
  ),
};

const report = {
  credentials: {
    present: Boolean(cred),
    length: cred.length,
    which: credWhich,
  },
  bases: {
    AIRTABLE_PAYMENTS_BASE_ID: {
      present: Boolean(base.value),
      redacted: redactBase(base.value),
      source: base.source,
      usedCodeDefault: !base.value,
    },
    effectivePaymentsBaseRedacted: redactBase(effectiveBase),
    matchesKnownProductionDefault: matchesProductionDefault,
    AIRTABLE_PLATFORM_BASE_ID: {
      present: Boolean(platformBase.value),
      redacted: redactBase(platformBase.value),
      source: platformBase.source,
    },
    PEOPLE_AIRTABLE_CERT_BASE_ID: {
      present: Boolean(peopleCertBase.value),
      redacted: redactBase(peopleCertBase.value),
      source: peopleCertBase.source,
    },
  },
  designationHints,
  flags: {
    UNIVERSAL_PEOPLE: resolve('UNIVERSAL_PEOPLE').value || '(unset/OFF)',
    UNIVERSAL_PEOPLE_PERSIST: resolve('UNIVERSAL_PEOPLE_PERSIST').value || '(unset/OFF)',
    VERCEL_ENV: resolve('VERCEL_ENV').value || '(unset)',
    NODE_ENV: resolve('NODE_ENV').value || '(unset)',
  },
  envFilesSeen,
  knownProductionDefaultRedacted: redactBase(PRODUCTION_DEFAULT),
};

console.log(JSON.stringify(report, null, 2));
