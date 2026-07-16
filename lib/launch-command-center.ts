import { getAirtableApiKey, productionSecretIssues } from '@/lib/integration-env';
import { checkAirtableLaunchSchema } from '@/lib/airtable-schema-check';
import { isCaptureApiKeyConfigured } from '@/lib/capture-api-key';
import { getTier2EnvChecks, isTier2AutomationReady } from '@/lib/launch-tier2';
import { buildLaunchReadinessModel } from '@/lib/launch-readiness';
import type { LaunchReadinessModel, LaunchReadinessStatus } from '@/lib/launch-readiness';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';
import { parseResendFromEmail, RESEND_FROM_EMAIL_EXAMPLE } from '@/lib/resend-env';
import {
  probeSimplifiAppDns,
  sentryConfigured,
  uptimeConfigured,
} from '@/lib/simplifi-pass1-ops';

export const CANONICAL_PRODUCTION_URL = 'https://www.efficiencyarchitects.online';

export type LaunchAutomation = 'fully_automated' | 'partially_automated' | 'manual_only';

export type LaunchStatus = 'complete' | 'missing' | 'needs_credentials' | 'needs_human_action';

export type LaunchSectionId =
  | 'infrastructure'
  | 'payments'
  | 'communications'
  | 'onboarding'
  | 'domains'
  | 'security'
  | 'friend_testing';

export const LAUNCH_SECTION_LABELS: Record<LaunchSectionId, string> = {
  infrastructure: 'Infrastructure',
  payments: 'Payments',
  communications: 'Communications',
  onboarding: 'Onboarding',
  domains: 'Domains',
  security: 'Security',
  friend_testing: 'Friend Testing',
};

export type LaunchCheckItem = {
  id: string;
  section: LaunchSectionId;
  category: string;
  name: string;
  automation: LaunchAutomation;
  status: LaunchStatus;
  score: number;
  maxScore: number;
  message: string;
  fix?: string;
  verify?: string;
};

export type LaunchSectionSummary = {
  id: LaunchSectionId;
  name: string;
  score: number;
  maxScore: number;
  complete: number;
  blockers: number;
  warnings: number;
  items: LaunchCheckItem[];
};

export type LaunchCommandCenterReport = {
  generatedAt: string;
  readinessScore: number;
  status: LaunchReadinessStatus;
  readiness: LaunchReadinessModel;
  launchBlockers: number;
  warnings: number;
  recommendedNextAction: string;
  summary: {
    complete: number;
    missing: number;
    needsCredentials: number;
    needsHumanAction: number;
    total: number;
  };
  sections: LaunchSectionSummary[];
  items: LaunchCheckItem[];
  links: {
    healthLaunch: string;
    commandCenter: string;
    start: string;
    checkout: string;
    tier2Guide: string;
    makeOnboardingGuide: string;
    dnsGuide: string;
    esignGuide: string;
    contractSignedGuide: string;
    friendTestingGuide: string;
    finalReport: string;
  };
};

const CLIENT_ONBOARDING_FIELDS = [
  'Onboarding Status',
  'Payment Received At',
  'Docs Sent At',
  'Docs Signed At',
] as const;

function item(
  partial: Omit<LaunchCheckItem, 'score'> & { score?: number },
): LaunchCheckItem {
  const maxScore = partial.maxScore;
  let score = partial.score ?? 0;
  if (partial.status === 'complete') score = maxScore;
  else if (partial.status === 'missing') score = 0;
  else if (partial.status === 'needs_credentials') score = Math.min(score, maxScore * 0.25);
  else if (partial.status === 'needs_human_action') score = Math.min(score, maxScore * 0.5);
  return { ...partial, score };
}

function isMakeWebhookUrl(url: string | undefined): boolean {
  if (!url?.trim()) return false;
  try {
    const u = new URL(url);
    return u.hostname.includes('make.com') || u.hostname.includes('integromat.com');
  } catch {
    return false;
  }
}

async function checkClientOnboardingFields(): Promise<{
  ok: boolean;
  missing: string[];
  needsCredentials: boolean;
}> {
  const key = getAirtableApiKey();
  if (!key) return { ok: false, missing: [...CLIENT_ONBOARDING_FIELDS], needsCredentials: true };

  const baseId = process.env.AIRTABLE_PAYMENTS_BASE_ID ?? 'appv0YoLIMY45fmDA';
  try {
    const res = await fetch(`https://api.airtable.com/v0/meta/bases/${baseId}/tables`, {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (!res.ok) return { ok: false, missing: [...CLIENT_ONBOARDING_FIELDS], needsCredentials: res.status === 401 };
    const data = (await res.json()) as { tables?: { name: string; fields?: { name: string }[] }[] };
    const table = data.tables?.find((t) => t.name === 'Client Records');
    if (!table) return { ok: false, missing: [...CLIENT_ONBOARDING_FIELDS], needsCredentials: false };
    const names = new Set((table.fields ?? []).map((f) => f.name));
    const missing = CLIENT_ONBOARDING_FIELDS.filter((f) => !names.has(f));
    return { ok: missing.length === 0, missing, needsCredentials: false };
  } catch {
    return { ok: false, missing: [...CLIENT_ONBOARDING_FIELDS], needsCredentials: false };
  }
}

async function checkResendDomain(): Promise<{
  ok: boolean;
  status: LaunchStatus;
  message: string;
  domain?: string;
}> {
  const key = process.env.RESEND_API_KEY?.trim();
  const fromRaw = process.env.RESEND_FROM_EMAIL;
  if (!key || !fromRaw?.trim()) {
    return { ok: false, status: 'missing', message: 'RESEND_API_KEY or RESEND_FROM_EMAIL not set.' };
  }

  const parsed = parseResendFromEmail(fromRaw);
  if (!parsed || parsed.parseError) {
    if (parsed?.parseError === 'missing_at') {
      return {
        ok: false,
        status: 'missing',
        message: `RESEND_FROM_EMAIL must include @ (e.g. ${RESEND_FROM_EMAIL_EXAMPLE}). Current value has no @ symbol.`,
      };
    }
    return {
      ok: false,
      status: 'missing',
      message: `RESEND_FROM_EMAIL format invalid. Use ${RESEND_FROM_EMAIL_EXAMPLE} or Name <${RESEND_FROM_EMAIL_EXAMPLE}>.`,
    };
  }

  const { domain, address } = parsed;

  try {
    const res = await fetch('https://api.resend.com/domains', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.status === 401) {
      return { ok: false, status: 'needs_credentials', message: 'Resend API key rejected (401).' };
    }
    if (!res.ok) {
      return { ok: false, status: 'needs_human_action', message: `Resend domains API returned ${res.status}.` };
    }
    const data = (await res.json()) as { data?: { name: string; status: string }[] };
    const domains = data.data ?? [];
    const match =
      domains.find((d) => d.name === domain) ??
      domains.find((d) => address.endsWith(`@${d.name}`));
    if (match?.status === 'verified') {
      return {
        ok: true,
        status: 'complete',
        message: `Domain ${match.name} verified. Sending from ${address}.`,
        domain: match.name,
      };
    }
    if (match) {
      return {
        ok: false,
        status: 'needs_human_action',
        message: `Domain ${match.name} status: ${match.status} — verify at resend.com/domains`,
        domain: match.name,
      };
    }
    return {
      ok: false,
      status: 'needs_human_action',
      message: `Domain ${domain} not found in Resend — add DNS records at resend.com/domains for ${domain}`,
      domain,
    };
  } catch {
    return { ok: false, status: 'needs_human_action', message: 'Could not reach Resend API.' };
  }
}

async function checkEsignaturesCallback(): Promise<{
  ok: boolean;
  status: LaunchStatus;
  message: string;
}> {
  const url = `${EA_PLATFORM_URL}/api/webhooks/esignatures`;
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'launch.command_center.ping', test: true }),
      signal: AbortSignal.timeout(12000),
    });
    if (res.status === 404) {
      return { ok: false, status: 'missing', message: `Callback route not found: ${url}` };
    }
    if (res.ok || res.status === 400) {
      return { ok: true, status: 'complete', message: `eSignatures callback route live at ${url}` };
    }
    return {
      ok: false,
      status: 'needs_human_action',
      message: `Callback ${url} returned HTTP ${res.status}.`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'needs_human_action',
      message: `Could not reach callback: ${err instanceof Error ? err.message : 'network error'}`,
    };
  }
}

function checkEsignTemplateEnv(): { ok: boolean; status: LaunchStatus; message: string } {
  const msa = process.env.ESIGNATURES_MSA_TEMPLATE_ID?.trim();
  const sow = process.env.ESIGNATURES_SOW_TEMPLATE_ID?.trim();
  if (msa && sow) {
    return {
      ok: true,
      status: 'complete',
      message: 'MSA and SOW template IDs configured on Vercel.',
    };
  }
  if (msa || sow) {
    return {
      ok: false,
      status: 'needs_human_action',
      message: `Set both ESIGNATURES_MSA_TEMPLATE_ID and ESIGNATURES_SOW_TEMPLATE_ID (have ${msa ? 'MSA' : 'SOW'} only).`,
    };
  }
  return {
    ok: false,
    status: 'needs_human_action',
    message: 'Upload MSA/SOW at esignatures.io → set ESIGNATURES_MSA_TEMPLATE_ID + ESIGNATURES_SOW_TEMPLATE_ID on Vercel.',
  };
}

function buildSections(items: LaunchCheckItem[]): LaunchSectionSummary[] {
  const order: LaunchSectionId[] = [
    'infrastructure',
    'payments',
    'communications',
    'onboarding',
    'domains',
    'security',
    'friend_testing',
  ];

  return order.map((id) => {
    const sectionItems = items.filter((i) => i.section === id);
    const scored = sectionItems.filter((i) => i.maxScore > 0);
    const score = scored.reduce((s, i) => s + i.score, 0);
    const maxScore = scored.reduce((s, i) => s + i.maxScore, 0);
    return {
      id,
      name: LAUNCH_SECTION_LABELS[id],
      score,
      maxScore,
      complete: sectionItems.filter((i) => i.status === 'complete').length,
      blockers: sectionItems.filter((i) => i.maxScore > 0 && i.status !== 'complete').length,
      warnings: sectionItems.filter(
        (i) => i.status === 'needs_human_action' || i.status === 'needs_credentials',
      ).length,
      items: sectionItems,
    };
  });
}

function recommendNextAction(items: LaunchCheckItem[], tier2Ready: boolean): string {
  const byId = Object.fromEntries(items.map((i) => [i.id, i]));

  if (byId.resend_domain && byId.resend_domain.status !== 'complete') {
    return byId.resend_domain.message;
  }
  if (byId.make_esign_webhook && byId.make_esign_webhook.status !== 'complete') {
    return 'Create Make scenario EA Contract Signed → set ESIGN_WEBHOOK_URL on Vercel → docs/MAKE-EA-CONTRACT-SIGNED-SCENARIO.md';
  }
  if (byId.esignatures_templates && byId.esignatures_templates.status !== 'complete') {
    return byId.esignatures_templates.message;
  }
  if (byId.dns_simplifi_app && byId.dns_simplifi_app.status !== 'complete') {
    return 'Simplifi Pass 1: branded host down — confirm simplifi.ai on Vercel Domains — docs/SIMPLIFI-GOAL-B-OPERATOR.md';
  }
  if (byId.sentry && byId.sentry.status !== 'complete') {
    return 'Simplifi Pass 1: set NEXT_PUBLIC_SENTRY_DSN on Vercel Production and redeploy — docs/sentry-setup.md';
  }
  if (byId.uptime_dashboard && byId.uptime_dashboard.status !== 'complete') {
    return 'Simplifi Pass 1: set UPTIME_KUMA_DASHBOARD_URL (or UPTIME_MONITORING_URL) and confirm Simplifi monitors.';
  }
  if (byId.resend_domain?.status === 'complete' && byId.make_esign_webhook?.status === 'complete' && !tier2Ready) {
    return 'Complete remaining Tier 2 env vars (Resend + Stripe webhook secret).';
  }
  if (byId.stripe_live_checkout && byId.stripe_live_checkout.status !== 'complete') {
    return 'Run friend test checkout at /checkout — docs/FRIEND-TESTING-CHECKLIST.md';
  }
  if (byId.launch_setup_key_cleanup?.status === 'needs_human_action') {
    return 'Remove LAUNCH_SETUP_KEY from Vercel Production after setup is complete.';
  }
  return 'All automated blockers cleared — run live checkout friend test.';
}

async function checkStripeApi(): Promise<{ ok: boolean; status: LaunchStatus; message: string }> {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) return { ok: false, status: 'missing', message: 'STRIPE_SECRET_KEY not set.' };

  try {
    const res = await fetch('https://api.stripe.com/v1/balance', {
      headers: { Authorization: `Bearer ${key}` },
    });
    if (res.status === 401) {
      return { ok: false, status: 'needs_credentials', message: 'Stripe secret key invalid (401).' };
    }
    if (!res.ok) {
      return { ok: false, status: 'needs_human_action', message: `Stripe API returned ${res.status}.` };
    }
    return { ok: true, status: 'complete', message: 'Stripe API key valid.' };
  } catch {
    return { ok: false, status: 'needs_human_action', message: 'Could not reach Stripe API.' };
  }
}

async function checkDnsCanonical(): Promise<{ ok: boolean; status: LaunchStatus; message: string }> {
  const configuredBase = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, '');
  const messages: string[] = [];

  try {
    const res = await fetch(CANONICAL_PRODUCTION_URL, {
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    const looksLikeEa =
      html.includes('DISCOVER THE POSSIBILITIES') ||
      html.includes('SIMPLIFI') ||
      html.includes('Efficiency Architects');
    if (res.ok && looksLikeEa) {
      messages.push(`${CANONICAL_PRODUCTION_URL} serves EA platform (${res.status}).`);
    } else if (res.ok) {
      messages.push(`${CANONICAL_PRODUCTION_URL} responds but content may be wrong site.`);
      return { ok: false, status: 'needs_human_action', message: messages.join(' ') };
    } else {
      return {
        ok: false,
        status: 'needs_human_action',
        message: `${CANONICAL_PRODUCTION_URL} returned HTTP ${res.status}. See docs/DNS-THREE-CLICKS.md`,
      };
    }
  } catch (err) {
    return {
      ok: false,
      status: 'needs_human_action',
      message: `Could not reach ${CANONICAL_PRODUCTION_URL}: ${err instanceof Error ? err.message : 'error'}`,
    };
  }

  if (configuredBase && configuredBase !== CANONICAL_PRODUCTION_URL) {
    messages.push(`NEXT_PUBLIC_BASE_URL is ${configuredBase} (expected ${CANONICAL_PRODUCTION_URL}).`);
    return { ok: false, status: 'needs_human_action', message: messages.join(' ') };
  }

  return { ok: true, status: 'complete', message: messages.join(' ') };
}

async function probeMakeWebhook(
  url: string | undefined,
  label: string,
): Promise<{ ok: boolean; status: LaunchStatus; message: string }> {
  if (!url?.trim()) {
    return { ok: false, status: 'missing', message: `${label} not set on server.` };
  }
  if (!isMakeWebhookUrl(url)) {
    return { ok: false, status: 'needs_human_action', message: `${label} does not look like a Make webhook URL.` };
  }
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event: 'launch.command_center.ping', test: true, at: new Date().toISOString() }),
      signal: AbortSignal.timeout(10000),
    });
    if (res.ok || res.status === 202) {
      return { ok: true, status: 'complete', message: `${label} reachable (HTTP ${res.status}). Check Make history.` };
    }
    return {
      ok: false,
      status: 'needs_human_action',
      message: `${label} returned HTTP ${res.status} — verify scenario is ON in Make.`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'needs_human_action',
      message: `${label} probe failed: ${err instanceof Error ? err.message : 'network error'}`,
    };
  }
}

export async function runLaunchCommandCenter(options?: {
  demoClient?: boolean;
  selenaCapture?: boolean;
  captureReady?: boolean;
}): Promise<LaunchCommandCenterReport> {
  const base = EA_PLATFORM_URL;
  const tier2 = getTier2EnvChecks();
  const secretIssues = productionSecretIssues();
  const schema = await checkAirtableLaunchSchema();
  const clientFields = await checkClientOnboardingFields();
  const resendDomain = await checkResendDomain();
  const stripeApi = await checkStripeApi();
  const dns = await checkDnsCanonical();
  const simplifiDns = await probeSimplifiAppDns();
  const esignCallback = await checkEsignaturesCallback();
  const esignTemplates = checkEsignTemplateEnv();
  const onboardingProbe = await probeMakeWebhook(process.env.ONBOARDING_WEBHOOK_URL, 'ONBOARDING_WEBHOOK_URL');
  const esignProbe = await probeMakeWebhook(process.env.ESIGN_WEBHOOK_URL, 'ESIGN_WEBHOOK_URL');

  const demoClient = options?.demoClient ?? false;
  const selenaCapture = options?.selenaCapture ?? false;
  const captureReady = options?.captureReady ?? schema.capture.ok;

  const items: LaunchCheckItem[] = [
    item({
      id: 'airtable_api',
      section: 'infrastructure',
      category: 'Airtable',
      name: 'Airtable API key configured',
      automation: 'fully_automated',
      status: getAirtableApiKey() ? 'complete' : 'missing',
      maxScore: 5,
      message: getAirtableApiKey() ? 'AIRTABLE_API_KEY present.' : 'Set AIRTABLE_API_KEY on Vercel.',
      fix: 'vercel env add AIRTABLE_API_KEY production',
      verify: 'npm run verify-airtable',
    }),
    item({
      id: 'airtable_capture_schema',
      section: 'infrastructure',
      category: 'Airtable',
      name: 'Capture Records schema',
      automation: 'fully_automated',
      status: schema.capture.ok ? 'complete' : schema.capture.exists ? 'needs_human_action' : 'missing',
      maxScore: 8,
      message: schema.capture.ok
        ? 'Capture Records has all required columns.'
        : schema.capture.exists
          ? `Missing columns: ${schema.capture.missingFields.join(', ')}`
          : 'Capture Records table not found.',
      fix: 'scripts/run-capture-pulse-setup.bat or POST /api/health/setup-schema',
      verify: 'npm run verify-airtable',
    }),
    item({
      id: 'airtable_pulse_schema',
      section: 'infrastructure',
      category: 'Airtable',
      name: 'Pulse Events schema',
      automation: 'fully_automated',
      status: schema.pulse.ok ? 'complete' : schema.pulse.configured ? 'needs_human_action' : 'missing',
      maxScore: 4,
      message: schema.pulse.ok
        ? 'Pulse Events table configured.'
        : 'Set PULSE_EVENTS_TABLE and run setup-pulse-events.',
      verify: 'npm run setup-pulse-events',
    }),
    item({
      id: 'airtable_client_onboarding_fields',
      section: 'infrastructure',
      category: 'Airtable',
      name: 'Client Records onboarding fields',
      automation: 'partially_automated',
      status: clientFields.ok
        ? 'complete'
        : clientFields.needsCredentials
          ? 'needs_credentials'
          : 'needs_human_action',
      maxScore: 5,
      message: clientFields.ok
        ? 'Onboarding Status + docs timestamps exist.'
        : `Missing: ${clientFields.missing.join(', ')}`,
      fix: 'ea-operating-system/scripts/setup-airtable-onboarding-fields.mjs',
    }),
    item({
      id: 'airtable_demo_client',
      section: 'friend_testing',
      category: 'Airtable',
      name: 'Demo client (friend testing)',
      automation: 'fully_automated',
      status: demoClient ? 'complete' : 'needs_human_action',
      maxScore: 5,
      message: demoClient ? 'demo-client portal slug found.' : 'Run scripts/seed-demo-client.mjs',
      verify: 'GET /api/health/launch → demoClient: true',
    }),
    item({
      id: 'stripe_keys',
      section: 'payments',
      category: 'Stripe',
      name: 'Stripe API keys',
      automation: 'partially_automated',
      status: stripeApi.status,
      maxScore: 6,
      message: stripeApi.message,
      fix: 'Vercel → STRIPE_SECRET_KEY + NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY',
    }),
    item({
      id: 'stripe_webhook_secret',
      section: 'payments',
      category: 'Stripe',
      name: 'Stripe webhook secret',
      automation: 'partially_automated',
      status: tier2.stripeWebhookSecret ? 'complete' : 'missing',
      maxScore: 4,
      message: tier2.stripeWebhookSecret
        ? 'STRIPE_WEBHOOK_SECRET set.'
        : 'Add STRIPE_WEBHOOK_SECRET from Stripe webhook endpoint.',
      fix: 'Stripe Dashboard → Webhooks → ea-payments /api/webhooks/stripe',
    }),
    item({
      id: 'stripe_live_checkout',
      section: 'friend_testing',
      category: 'Stripe',
      name: 'Live checkout end-to-end test',
      automation: 'manual_only',
      status: 'needs_human_action',
      maxScore: 0,
      score: 0,
      message: 'Run one real payment at /checkout; confirm Airtable row + welcome email.',
      fix: `${base}/checkout`,
      verify: 'npm run test:tier2',
    }),
    item({
      id: 'resend_env',
      section: 'communications',
      category: 'Resend',
      name: 'Resend env vars',
      automation: 'fully_automated',
      status: tier2.resend && tier2.resendFrom ? 'complete' : 'missing',
      maxScore: 4,
      message:
        tier2.resend && tier2.resendFrom
          ? 'RESEND_API_KEY and RESEND_FROM_EMAIL set.'
          : 'Set Resend keys on Vercel.',
    }),
    item({
      id: 'resend_domain',
      section: 'communications',
      category: 'Resend',
      name: 'Resend sending domain verified',
      automation: 'partially_automated',
      status: resendDomain.status,
      maxScore: 6,
      message: resendDomain.message,
      fix: 'https://resend.com/domains',
    }),
    item({
      id: 'make_onboarding_webhook',
      section: 'onboarding',
      category: 'Make',
      name: 'ONBOARDING_WEBHOOK_URL',
      automation: 'partially_automated',
      status: onboardingProbe.status,
      maxScore: 10,
      message: onboardingProbe.message,
      fix: 'docs/MAKE-EA-ONBOARDING-SCENARIO.md → scripts/run-tier2-setup.bat',
      verify: 'POST /api/health/test-webhooks target=onboarding',
    }),
    item({
      id: 'make_esign_webhook',
      section: 'onboarding',
      category: 'Make',
      name: 'ESIGN_WEBHOOK_URL',
      automation: 'partially_automated',
      status: esignProbe.status,
      maxScore: 8,
      message: esignProbe.message,
      fix: 'docs/MAKE-TIER2.md',
      verify: 'POST /api/health/test-webhooks target=esign',
    }),
    item({
      id: 'make_content_webhook',
      section: 'onboarding',
      category: 'Make',
      name: 'CONTENT_REQUEST_WEBHOOK_URL',
      automation: 'fully_automated',
      status: Boolean(process.env.CONTENT_REQUEST_WEBHOOK_URL?.trim()) ? 'complete' : 'missing',
      maxScore: 2,
      message: process.env.CONTENT_REQUEST_WEBHOOK_URL
        ? 'Content request webhook configured.'
        : 'Optional — set CONTENT_REQUEST_WEBHOOK_URL.',
    }),
    item({
      id: 'make_onboarding_scenario',
      section: 'onboarding',
      category: 'Make',
      name: 'EA Onboarding Webhook scenario (Make UI)',
      automation: 'manual_only',
      status: onboardingProbe.ok ? 'complete' : 'needs_human_action',
      maxScore: 0,
      score: 0,
      message: 'Build scenario EA Onboarding Webhook in Make (not AI Agent).',
      fix: 'docs/MAKE-EA-ONBOARDING-SCENARIO.md',
    }),
    item({
      id: 'esignatures_callback',
      section: 'onboarding',
      category: 'eSignatures',
      name: 'eSignatures callback route',
      automation: 'fully_automated',
      status: esignCallback.status,
      maxScore: 4,
      message: esignCallback.message,
      fix: `${EA_PLATFORM_URL}/api/webhooks/esignatures`,
      verify: 'docs/ESIGNATURES-SETUP.md',
    }),
    item({
      id: 'esignatures_templates',
      section: 'onboarding',
      category: 'eSignatures',
      name: 'MSA + SOW template IDs',
      automation: 'partially_automated',
      status: esignTemplates.status,
      maxScore: 4,
      message: esignTemplates.message,
      fix: 'docs/ESIGNATURES-SETUP.md',
    }),
    item({
      id: 'make_esign_scenario',
      section: 'onboarding',
      category: 'Make',
      name: 'EA Contract Signed scenario (Make UI)',
      automation: 'manual_only',
      status: esignProbe.ok ? 'complete' : 'needs_human_action',
      maxScore: 0,
      score: 0,
      message: 'Build scenario EA Contract Signed in Make — docs/MAKE-EA-CONTRACT-SIGNED-SCENARIO.md',
      fix: 'docs/MAKE-EA-CONTRACT-SIGNED-SCENARIO.md',
    }),
    item({
      id: 'dns_canonical',
      section: 'domains',
      category: 'DNS',
      name: 'Canonical domain www.efficiencyarchitects.online',
      automation: 'partially_automated',
      status: dns.status,
      maxScore: 8,
      message: dns.message,
      fix: 'docs/DNS-THREE-CLICKS.md',
    }),
    item({
      id: 'dns_simplifi_app',
      section: 'domains',
      category: 'DNS',
      name: 'simplifi.ai branded host (real app)',
      automation: 'partially_automated',
      status: simplifiDns.ok ? 'complete' : 'needs_human_action',
      maxScore: 4,
      message: simplifiDns.ok
        ? simplifiDns.message
        : `${simplifiDns.message} GoDaddy: A record → 76.76.21.21 for apex and app.`,
      fix: 'docs/SIMPLIFI-GOAL-B-OPERATOR.md',
      verify: 'node scripts/validate-simplifi-launch-readiness.mjs https://efficiencyarchitects.online',
    }),
    item({
      id: 'session_secrets',
      section: 'security',
      category: 'Security',
      name: 'Production session secrets',
      automation: 'fully_automated',
      status: secretIssues.length === 0 ? 'complete' : 'missing',
      maxScore: 5,
      message:
        secretIssues.length === 0
          ? 'SESSION_SECRET and core secrets OK.'
          : `Missing: ${secretIssues.join(', ')}`,
    }),
    item({
      id: 'praison_make_webhook',
      section: 'infrastructure',
      category: 'CTP Intelligence',
      name: 'PraisonAI → Make package webhook',
      automation: 'partially_automated',
      status:
        process.env.PRAISON_PACKAGE_WEBHOOK_URL?.trim() ||
        process.env.CTP_INTELLIGENCE_WEBHOOK_URL?.trim()
          ? 'complete'
          : 'needs_human_action',
      maxScore: 0,
      score: 0,
      message:
        process.env.PRAISON_PACKAGE_WEBHOOK_URL?.trim() ||
        process.env.CTP_INTELLIGENCE_WEBHOOK_URL?.trim()
          ? 'Praison package webhook configured.'
          : 'Optional — Make scenario for praison.package.ready',
      fix: 'docs/MAKE-PRAISON-CTP.md → PRAISON_PACKAGE_WEBHOOK_URL on Vercel',
    }),
    item({
      id: 'open_design_github',
      section: 'infrastructure',
      category: 'Open Design',
      name: 'Open Design → GitHub handoff',
      automation: 'partially_automated',
      status:
        process.env.GITHUB_TOKEN?.trim() || process.env.OPEN_DESIGN_GITHUB_TOKEN?.trim()
          ? 'complete'
          : 'needs_human_action',
      maxScore: 0,
      score: 0,
      message:
        process.env.GITHUB_TOKEN?.trim() || process.env.OPEN_DESIGN_GITHUB_TOKEN?.trim()
          ? 'GitHub token ready for Open Design PRs.'
          : 'Optional — enables Cursor handoff PRs from Open Design',
      fix: 'Set GITHUB_TOKEN on Vercel — docs/OPEN-DESIGN-ARCHITECTURE.md',
    }),
    item({
      id: 'sentry',
      section: 'security',
      category: 'Sentry',
      name: 'Error monitoring (Sentry DSN)',
      automation: 'partially_automated',
      status: sentryConfigured() ? 'complete' : 'needs_human_action',
      maxScore: 4,
      message: sentryConfigured()
        ? 'NEXT_PUBLIC_SENTRY_DSN set — Sentry enabled.'
        : 'Set NEXT_PUBLIC_SENTRY_DSN on Vercel Production and redeploy — docs/sentry-setup.md',
      fix: 'https://sentry.io → NEXT_PUBLIC_SENTRY_DSN on Vercel',
    }),
    item({
      id: 'uptime_dashboard',
      section: 'security',
      category: 'Uptime',
      name: 'Uptime monitoring dashboard',
      automation: 'partially_automated',
      status: uptimeConfigured() ? 'complete' : 'needs_human_action',
      maxScore: 3,
      message: uptimeConfigured()
        ? 'Uptime dashboard URL configured.'
        : 'Set UPTIME_KUMA_DASHBOARD_URL or UPTIME_MONITORING_URL; cover /simplifi/capture + /api/health/launch.',
      fix: 'docs/SIMPLIFI-GOAL-B-OPERATOR.md',
    }),
    item({
      id: 'clerk',
      section: 'security',
      category: 'Clerk',
      name: 'Clerk authentication',
      automation: 'fully_automated',
      status: 'complete',
      maxScore: 0,
      score: 0,
      message: 'Not used in ea-payments — portal uses HMAC sessions (SESSION_SECRET). SisterHub uses Clerk separately.',
    }),
    item({
      id: 'capture_pipeline',
      section: 'infrastructure',
      category: 'Product',
      name: 'Simplifi capture pipeline',
      automation: 'fully_automated',
      status: captureReady ? 'complete' : 'missing',
      maxScore: 6,
      message: captureReady ? 'asyncCapture ready.' : 'Fix Capture Records schema.',
      verify: 'npm run test:capture-e2e',
    }),
    item({
      id: 'magnifi_selena',
      section: 'infrastructure',
      category: 'Product',
      name: 'Magnifi Selena demo',
      automation: 'fully_automated',
      status: selenaCapture ? 'complete' : 'needs_human_action',
      maxScore: 3,
      message: selenaCapture ? 'Consider/selena resolves.' : 'Run seed-demo-client or add Selena capture.',
    }),
    item({
      id: 'chrome_extension_key',
      section: 'infrastructure',
      category: 'Product',
      name: 'Chrome extension API key',
      automation: 'partially_automated',
      status: isCaptureApiKeyConfigured() ? 'complete' : 'needs_human_action',
      maxScore: 0,
      score: 0,
      message: isCaptureApiKeyConfigured()
        ? 'Capture API key ready (explicit or derived from ADMIN_SESSION_SECRET).'
        : 'Set EA_CAPTURE_API_KEY or ADMIN_SESSION_SECRET — then /extension/connect',
      fix: '/extension/connect',
    }),
    item({
      id: 'launch_setup_key_cleanup',
      section: 'security',
      category: 'Security',
      name: 'Remove LAUNCH_SETUP_KEY after setup',
      automation: 'partially_automated',
      status: process.env.LAUNCH_SETUP_KEY?.trim() ? 'needs_human_action' : 'complete',
      maxScore: 0,
      score: 0,
      message: process.env.LAUNCH_SETUP_KEY
        ? 'LAUNCH_SETUP_KEY still set — delete from Vercel after schema setup.'
        : 'LAUNCH_SETUP_KEY not present (good).',
    }),
  ];

  const scored = items.filter((i) => i.maxScore > 0);
  const earned = scored.reduce((s, i) => s + i.score, 0);
  const max = scored.reduce((s, i) => s + i.maxScore, 0);
  const readinessScore = max > 0 ? Math.round((earned / max) * 100) : 0;

  const controls = {
    sentryDsn: sentryConfigured(),
    uptimeDashboard: uptimeConfigured(),
    backupDestination: Boolean(process.env.BACKUP_DESTINATION_URI?.trim()),
  };
  const readiness = buildLaunchReadinessModel({
    revenue: {
      stripe: tier2.stripe,
      stripeWebhookSecret: tier2.stripeWebhookSecret,
      airtable: Boolean(getAirtableApiKey()),
      resend: tier2.resend,
      resendFrom: tier2.resendFrom,
    },
    delivery: {
      onboardingWebhook: tier2.onboardingWebhook,
      esignWebhook: tier2.esignWebhook,
      captureSchema: schema.capture.ok,
      pulseSchema: schema.pulse.ok,
      assessmentSchema: schema.assessment.ok,
      proposalSchema: schema.proposal.ok,
    },
    monitoring: {
      sentryDsn: controls.sentryDsn,
      uptimeDashboard: controls.uptimeDashboard,
    },
    resilience: {
      backupDestination: controls.backupDestination,
    },
  });

  const summary = {
    complete: items.filter((i) => i.status === 'complete').length,
    missing: items.filter((i) => i.status === 'missing').length,
    needsCredentials: items.filter((i) => i.status === 'needs_credentials').length,
    needsHumanAction: items.filter((i) => i.status === 'needs_human_action').length,
    total: items.length,
  };

  const sections = buildSections(items);
  const launchBlockers = readiness.missing.revenue.missing.length + readiness.missing.delivery.missing.length;
  const warnings = items.filter(
    (i) => i.status === 'needs_human_action' || i.status === 'needs_credentials',
  ).length;
  const tier2Ready = isTier2AutomationReady(tier2);

  return {
    generatedAt: new Date().toISOString(),
    readinessScore,
    status: readiness.status,
    readiness,
    launchBlockers,
    warnings,
    recommendedNextAction: recommendNextAction(items, tier2Ready),
    summary,
    sections,
    items,
    links: {
      healthLaunch: `${base}/api/health/launch`,
      commandCenter: `${base}/api/health/command-center`,
      start: `${base}/start`,
      checkout: `${base}/checkout`,
      tier2Guide: 'docs/MAKE-TIER2.md',
      makeOnboardingGuide: 'docs/MAKE-EA-ONBOARDING-SCENARIO.md',
      dnsGuide: 'docs/DNS-THREE-CLICKS.md',
      esignGuide: 'docs/ESIGNATURES-SETUP.md',
      contractSignedGuide: 'docs/MAKE-EA-CONTRACT-SIGNED-SCENARIO.md',
      friendTestingGuide: 'docs/FRIEND-TESTING-CHECKLIST.md',
      finalReport: 'docs/FINAL-LAUNCH-REPORT.md',
    },
  };
}

/** Server-side entry: loads live product signals then runs all checks. */
export async function buildLaunchCommandCenterReport(): Promise<LaunchCommandCenterReport> {
  const { getClientByPortalSlug } = await import('@/lib/airtable');
  const { resolveConsiderExperience } = await import('@/lib/consider-resolve');

  let demoClient = false;
  let selenaCapture = false;
  let captureReady = false;

  try {
    demoClient = Boolean(await getClientByPortalSlug('demo-client'));
  } catch {
    demoClient = false;
  }

  try {
    selenaCapture = Boolean(await resolveConsiderExperience('selena'));
  } catch {
    selenaCapture = false;
  }

  try {
    const schema = await checkAirtableLaunchSchema();
    captureReady = schema.capture.ok;
  } catch {
    captureReady = false;
  }

  return runLaunchCommandCenter({ demoClient, selenaCapture, captureReady });
}
