/**
 * Simplifi Goal B Pass 1 — operator infrastructure status.
 * Shared by Launch Command Center and Mission Control attention.
 */
import type { AttentionItem } from '@/lib/pulse-attention';

export const SIMPLIFI_APP_URL =
  process.env.SIMPLIFI_APP_URL?.replace(/\/$/, '') || 'https://app.simplifi.ai';

export type SimplifiPass1Check = {
  id: 'dns_simplifi_app' | 'sentry' | 'uptime';
  ok: boolean;
  message: string;
  fix: string;
};

export async function probeSimplifiAppDns(): Promise<{
  ok: boolean;
  status: number;
  message: string;
}> {
  try {
    const res = await fetch(`${SIMPLIFI_APP_URL}/`, {
      method: 'GET',
      redirect: 'follow',
      signal: AbortSignal.timeout(10000),
    });
    if (res.status > 0 && res.status < 500) {
      return {
        ok: true,
        status: res.status,
        message: `${SIMPLIFI_APP_URL} responds (HTTP ${res.status}).`,
      };
    }
    return {
      ok: false,
      status: res.status,
      message: `${SIMPLIFI_APP_URL} returned HTTP ${res.status}.`,
    };
  } catch (err) {
    return {
      ok: false,
      status: 0,
      message: `${SIMPLIFI_APP_URL} does not resolve or is unreachable (${err instanceof Error ? err.message : 'error'}).`,
    };
  }
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
      message: dns.ok
        ? dns.message
        : `${dns.message} Add domain in Vercel + CNAME app → cname.vercel-dns.com.`,
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
          title: 'Attach app.simplifi.ai (Pass 1)',
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
