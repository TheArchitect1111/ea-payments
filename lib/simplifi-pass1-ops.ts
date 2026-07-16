/**
 * Simplifi Goal B Pass 1 — operator infrastructure status.
 * Shared by Launch Command Center and Mission Control attention.
 */
import type { AttentionItem } from '@/lib/pulse-attention';

/** Preferred branded host once DNS points at ea-payments. */
export const SIMPLIFI_BRAND_URL =
  process.env.NEXT_PUBLIC_SIMPLIFI_APP_URL?.replace(/\/$/, '') ||
  process.env.SIMPLIFI_APP_URL?.replace(/\/$/, '') ||
  'https://simplifi.ai';

/** Working production host for testers until branded DNS is correct. */
export const SIMPLIFI_TESTER_URL = 'https://efficiencyarchitects.online';

export const SIMPLIFI_APP_ALIAS_URL = 'https://app.simplifi.ai';

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
  try {
    const res = await fetch(`${url.replace(/\/$/, '')}/simplifi/capture`, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(12000),
    });
    const html = await res.text();
    if (res.ok && looksLikeSimplifiApp(html)) {
      return {
        ok: true,
        status: res.status,
        message: `${url} serves Simplifi capture (${res.status}).`,
      };
    }
    if (res.ok) {
      return {
        ok: false,
        status: res.status,
        message: `${url} responds but does not serve Simplifi capture (park/lander or wrong project). Point DNS A/CNAME to Vercel ea-payments.`,
      };
    }
    return {
      ok: false,
      status: res.status,
      message: `${url}/simplifi/capture returned HTTP ${res.status}.`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: `${url} unreachable (${err instanceof Error ? err.message : 'error'}).`,
    };
  }
}

/** Prefer branded host; accept tester host only as operational fallback messaging (not Pass 1 complete). */
export async function probeSimplifiAppDns(): Promise<{
  ok: boolean;
  status: number;
  message: string;
  url: string;
}> {
  const brand = await probeSimplifiHost(SIMPLIFI_BRAND_URL);
  if (brand.ok) {
    return { ...brand, url: SIMPLIFI_BRAND_URL };
  }
  const alias = await probeSimplifiHost(SIMPLIFI_APP_ALIAS_URL);
  if (alias.ok) {
    return { ...alias, url: SIMPLIFI_APP_ALIAS_URL };
  }
  return {
    ok: false,
    status: brand.status,
    url: SIMPLIFI_BRAND_URL,
    message: `${brand.message} Testers: use ${SIMPLIFI_TESTER_URL}/simplifi/capture until DNS is fixed.`,
  };
}

export function sentryConfigured(): boolean {
  return Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN?.trim());
}

export function uptimeConfigured(): boolean {
  return Boolean(
    process.env.UPTIME_KUMA_DASHBOARD_URL?.trim() || process.env.UPTIME_MONITORING_URL?.trim(),
  );
}

export async function getSimplifiPass1Checks(): Promise<SimplifiPass1Check[]> {
  const dns = await probeSimplifiAppDns();
  return [
    {
      id: 'dns_simplifi_app',
      ok: dns.ok,
      message: dns.message,
      fix: 'docs/SIMPLIFI-GOAL-B-OPERATOR.md#pass-1--infrastructure',
    },
    {
      id: 'sentry',
      ok: sentryConfigured(),
      message: sentryConfigured()
        ? 'NEXT_PUBLIC_SENTRY_DSN set — Sentry enabled.'
        : 'NEXT_PUBLIC_SENTRY_DSN missing — set on Vercel Production and redeploy.',
      fix: 'docs/sentry-setup.md',
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
          title: 'Point simplifi.ai DNS at ea-payments (Pass 1)',
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
          title: 'Set Sentry DSN (Pass 1)',
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
