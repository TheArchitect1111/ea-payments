/**
 * Custom domain → ClientConfig slug mapping.
 * Used by middleware (edge) and admin/API (node).
 *
 * Env override (JSON object):
 *   EA_CLIENT_DOMAIN_MAP={"www.prospects.ca":"cpr","portal.prospects.ca":"cpr:portal"}
 * Value forms: "slug" | "slug:site" | "slug:portal"
 */

export type ClientDomainSurface = 'site' | 'portal';

export type ClientDomainBinding = {
  host: string;
  slug: string;
  surface: ClientDomainSurface;
  /** Human label for admin */
  label?: string;
};

/** Seed bindings — add the hostname in Vercel Domains when ready. */
export const CLIENT_DOMAIN_BINDINGS: ClientDomainBinding[] = [
  {
    host: 'cpr.efficiencyarchitects.online',
    slug: 'cpr',
    surface: 'site',
    label: 'CPR public site',
  },
  {
    host: 'portal.cpr.efficiencyarchitects.online',
    slug: 'cpr',
    surface: 'portal',
    label: 'CPR team portal',
  },
  {
    host: 'etfm.efficiencyarchitects.online',
    slug: 'etfm',
    surface: 'site',
    label: 'ETFM coaching site',
  },
  {
    host: '3hc.efficiencyarchitects.online',
    slug: '3hc',
    surface: 'site',
    label: '3HC readiness site',
  },
  {
    host: 'rumball.efficiencyarchitects.online',
    slug: 'bob-rumball',
    surface: 'site',
    label: 'Bob Rumball learning site',
  },
  {
    host: 'ea.efficiencyarchitects.online',
    slug: 'ea',
    surface: 'site',
    label: 'EA platform site',
  },
];

function normalizeHost(host: string | null | undefined): string | null {
  if (!host?.trim()) return null;
  return host.split(':')[0]!.trim().toLowerCase();
}

function parseBindingValue(raw: string): { slug: string; surface: ClientDomainSurface } | null {
  const value = raw.trim().toLowerCase();
  if (!value) return null;
  const [slugPart, surfacePart] = value.split(':');
  const slug = slugPart?.trim();
  if (!slug) return null;
  const surface: ClientDomainSurface =
    surfacePart === 'portal' ? 'portal' : 'site';
  return { slug, surface };
}

function bindingsFromEnv(): ClientDomainBinding[] {
  const raw = process.env.EA_CLIENT_DOMAIN_MAP?.trim();
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Record<string, string>;
    return Object.entries(parsed).flatMap(([host, value]) => {
      const binding = parseBindingValue(value);
      if (!binding) return [];
      return [
        {
          host: host.toLowerCase(),
          slug: binding.slug,
          surface: binding.surface,
          label: `Env · ${host}`,
        },
      ];
    });
  } catch {
    return [];
  }
}

/** Merged registry: env overrides win over seed bindings for the same host. */
export function listClientDomainBindings(): ClientDomainBinding[] {
  const byHost = new Map<string, ClientDomainBinding>();
  for (const row of CLIENT_DOMAIN_BINDINGS) {
    byHost.set(row.host.toLowerCase(), row);
  }
  for (const row of bindingsFromEnv()) {
    byHost.set(row.host.toLowerCase(), row);
  }
  return [...byHost.values()].sort((a, b) => a.host.localeCompare(b.host));
}

export function getClientDomainBinding(
  host: string | null | undefined,
): ClientDomainBinding | null {
  const normalized = normalizeHost(host);
  if (!normalized) return null;
  return listClientDomainBindings().find((b) => b.host === normalized) ?? null;
}

export function listDomainsForSlug(slug: string): ClientDomainBinding[] {
  const s = slug.trim().toLowerCase();
  return listClientDomainBindings().filter((b) => b.slug === s);
}

/**
 * Resolve middleware entry for a custom client domain.
 * - `/` → `/site/{slug}` or `/portal/{slug}`
 * - `/portal` → `/portal/{slug}`
 * Returns an internal path (rewrite target), not a full URL.
 */
export function resolveClientDomainEntry(
  host: string | null | undefined,
  pathname: string,
): { path: string; surface: ClientDomainSurface; slug: string; mode: 'rewrite' } | null {
  const binding = getClientDomainBinding(host);
  if (!binding) return null;

  const path = pathname || '/';

  if (path === '/' || path === '') {
    const target =
      binding.surface === 'portal' ? `/portal/${binding.slug}` : `/site/${binding.slug}`;
    return { path: target, surface: binding.surface, slug: binding.slug, mode: 'rewrite' };
  }

  if (path === '/portal' || path === '/portal/') {
    return {
      path: `/portal/${binding.slug}`,
      surface: 'portal',
      slug: binding.slug,
      mode: 'rewrite',
    };
  }

  return null;
}

export function getClientDomainMapHealth() {
  const bindings = listClientDomainBindings();
  const envConfigured = Boolean(process.env.EA_CLIENT_DOMAIN_MAP?.trim());
  return {
    ok: bindings.length > 0,
    bindingCount: bindings.length,
    envConfigured,
    siteBindings: bindings.filter((b) => b.surface === 'site').length,
    portalBindings: bindings.filter((b) => b.surface === 'portal').length,
    hosts: bindings.map((b) => b.host),
  };
}
