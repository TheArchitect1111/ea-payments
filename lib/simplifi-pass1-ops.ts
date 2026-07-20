/**
 * Simplifi Goal B Pass 1 — operator infrastructure status.
 * Shared by Launch Command Center and Mission Control attention.
 */
import type { AttentionItem } from '@/lib/pulse-attention';
import { monitoringConfigured, monitoringDsnEnvHint } from '@/lib/monitoring';
import { SIMPLIFI_APP_URL, SIMPLIFI_ORB_ENTRY_URL } from '@/lib/simplifi-app-host';

/** Preferred branded host once DNS points at ea-payments. */
export const SIMPLIFI_BRAND_URL =
  process.env.NEXT_PUBLIC_SIMPLIFI_APP_URL?.replace(/\/$/, '') ||
  process.env.SIMPLIFI_APP_URL?.replace(/\/$/, '') ||
  SIMPLIFI_APP_URL;

/** Working production host for testers until branded DNS is correct. */
export const SIMPLIFI_TESTER_URL = 'https://efficiencyarchitects.online';

/** Legacy aspirational alias — only if EA owns it. Prefer SIMPLIFI_ORB_ENTRY_URL. */
export const SIMPLIFI_APP_ALIAS_URL = 'https://app.simplifi.ai';

export { SIMPLIFI_ORB_ENTRY_URL };

export type SimplifiPass1Check = {
  id: 'dns_simplifi_app' | 'sentry' | 'uptime';
  ok: boolean;
  message: string;
  fix: string;
};

function looksLikeSimplifiApp(html: string): boolean {
  const lower = html.toLowerCase();
  if (lower.includes('/lander') && html.length < 400) return false;
  return (
    lower.includes('simplifi') ||
    lower.includes('efficiency architects') ||
    lower.includes('capture') ||
    lower.includes('manifest-simplifi')
  );
}

async function probeSimplifiHost(url: string): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  const base = url.replace(/\/$/, '');
  // Prefer branded Orb entry; fall back to capture for legacy hosts.
  const probePaths = base.includes('efficiencyarchitects.online')
    ? ['/simplifiorb', '/simplifi/capture']
    : ['/simplifi/capture', '/simplifiorb'];

  let lastStatus = 0;
  let lastMessage = `${base} unreachable.`;

  for (const path of probePaths) {
    try {
      const res = await fetch(`${base}${path}`, {
        method: 'GET',
        redirect: 'follow',
        signal: AbortSignal.timeout(12000),
      });
      lastStatus = res.status;
      const html = await res.text();
      if (res.ok && looksLikeSimplifiApp(html)) {
        return {
          ok: true,
          status: res.status,
          message: `${base}${path} serves Simplifi (${res.status}).`,
        };
      }
      if (res.ok) {
        lastMessage = `${base}${path} responds but does not serve Simplifi (wrong project or stub).`;
      } else {
        lastMessage = `${base}${path} returned HTTP ${res.status}.`;
      }
    } catch (err) {
      lastMessage = `${base}${path} unreachable (${err instanceof Error ? err.message : 'error'}).`;
    }
  }

  return { ok: false, status: lastStatus, message: lastMessage };
}

/** Prefer EA-owned app host; apex fallback; unowned simplifi.ai is last/optional only. */
export async function probeSimplifiAppDns(): Promise<{
  ok: boolean;
  status: number;
  message: string;
  url: string;
}> {
  // Hard-prefer EA-owned host so env pointing at unowned simplifi.ai cannot false-fail Pass 1.
  const preferred = 'https://app.efficiencyarchitects.online';
  const preferredProbe = await probeSimplifiHost(preferred);
  if (preferredProbe.ok) {
    return { ...preferredProbe, url: preferred };
  }

  if (SIMPLIFI_BRAND_URL.replace(/\/$/, '') !== preferred) {
    const brand = await probeSimplifiHost(SIMPLIFI_BRAND_URL);
    if (brand.ok) {
      return { ...brand, url: SIMPLIFI_BRAND_URL };
    }
  }

  const apex = await probeSimplifiHost(SIMPLIFI_TESTER_URL);
  if (apex.ok) {
    return {
      ...apex,
      url: SIMPLIFI_TESTER_URL,
      message: `${apex.message} Preferred host ${preferred} not ready; apex /simplifiorb works. Confirm Namecheap CNAME app → cname.vercel-dns.com.`,
    };
  }

  // Unowned legacy — informational only after EA hosts fail.
  const alias = await probeSimplifiHost(SIMPLIFI_APP_ALIAS_URL);
  if (alias.ok) {
    return { ...alias, url: SIMPLIFI_APP_ALIAS_URL };
  }

  return {
    ok: false,
    status: preferredProbe.status,
    url: preferred,
    message: `${preferredProbe.message} Testers: use ${SIMPLIFI_TESTER_URL}/simplifiorb. Unowned simplifi.ai DNS is optional.`,
  };
}

export function sentryConfigured(): boolean {
  return monitoringConfigured();
}

export function uptimeConfigured(): boolean {
  return Boolean(
    process.env.UPTIME_KUMA_DASHBOARD_URL?.trim() || process.env.UPTIME_MONITORING_URL?.trim(),
  );
}

export async function getSimplifiPass1Checks(): Promise<SimplifiPass1Check[]> {
  const dns = await probeSimplifiAppDns();
  const monitoringOk = monitoringConfigured();
  const dsnHint = monitoringDsnEnvHint();
  return [
    {
      id: 'dns_simplifi_app',
      ok: dns.ok,
      message: dns.message,
      fix: 'docs/SIMPLIFI-GOAL-B-OPERATOR.md#pass-1--infrastructure',
    },
    {
      id: 'sentry',
      ok: monitoringOk,
      message: monitoringOk
        ? 'GlitchTip DSN set — error monitoring enabled (Sentry-compatible SDK).'
        : `${dsnHint} missing — set NEXT_PUBLIC_GLITCHTIP_DSN on Vercel Production and redeploy.`,
      fix: 'docs/GLITCHTIP-SETUP.md',
    },
    {
      id: 'uptime',
      ok: uptimeConfigured(),
      message: uptimeConfigured()
        ? 'Uptime dashboard URL configured.'
        : 'UPTIME_KUMA_DASHBOARD_URL (or UPTIME_MONITORING_URL) not set — confirm monitors cover /simplifi/capture + /api/health/launch.',
      fix: 'docs/SIMPLIFI-GOAL-B-OPERATOR.md#pass-1--infrastructure',
    },
  ];
}

/** Mission Control / Pulse attention cards for incomplete Pass 1 items. */
export async function buildSimplifiPass1AttentionItems(): Promise<AttentionItem[]> {
  const checks = await getSimplifiPass1Checks();
  return checks
    .filter((check) => !check.ok)
    .map((check) => {
      if (check.id === 'dns_simplifi_app') {
        return {
          id: 'ops-simplifi-dns',
          product: 'Simplifi',
          title: 'Point app.efficiencyarchitects.online at ea-payments',
          detail: check.message,
          priority: 'high' as const,
          href: '/launch',
          cta: 'Open Launch Command Center',
        };
      }
      if (check.id === 'sentry') {
        return {
          id: 'ops-sentry-dsn',
          product: 'Platform',
          title: 'Set GlitchTip DSN (Pass 1)',
          detail: check.message,
          priority: 'high' as const,
          href: '/launch',
          cta: 'Open Launch Command Center',
        };
      }
      return {
        id: 'ops-uptime',
        product: 'Platform',
        title: 'Confirm uptime monitoring (Pass 1)',
        detail: check.message,
        priority: 'medium' as const,
        href: '/launch',
        cta: 'Open Launch Command Center',
      };
    });
}
