import type { HelpEntry } from './manifest-loader';
import { loadPortalKnowledge } from './manifest-loader';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/**
 * Shared tenant-neutral access policy. Permissions belong to each portal's
 * knowledge manifest, never to this module or to the caller's question.
 * Existing function signatures are retained for the chassis contract.
 */
export type GuideRole = string;
type RolePolicy = {
  id: string;
  aliases?: string[];
  leastPrivileged?: boolean;
  allowedMenuPrefixes: string[];
  allowedIdsByGroup?: Record<string, string[]>;
  allowedHrefsByGroup?: Record<string, string[]>;
  requiredAudienceByGroup?: Record<string, string>;
  requiredAnyFieldsByGroup?: Record<string, string[]>;
};
type PortalRoleManifest = { roles?: RolePolicy[] };
type Registry = { portals?: Record<string, unknown> };

export function normalizeGuideRole(role: string | null | undefined): GuideRole {
  // No portalId is present in this public signature. Do not map unknown roles
  // to an Amanda-specific role. Resolve fallbacks against the matched manifest.
  const candidate = typeof role === 'string' ? role.trim().toLowerCase() : '';
  return /^[a-z][a-z0-9-]{0,63}$/.test(candidate) ? candidate : '';
}

function roleForEntry(entry: HelpEntry): RolePolicy[] | null {
  let registry: Registry;
  try {
    registry = JSON.parse(readFileSync(resolve(process.cwd(), 'knowledge/eva-portal-help-registry.json'), 'utf8')) as Registry;
  } catch { return null; }
  if (!registry?.portals || typeof registry.portals !== 'object') return null;
  // Identity-based ownership is deliberately fail-closed: each entry is the
  // exact object emitted by loadPortalKnowledge. No string/URL heuristic can
  // borrow an entry or permission from another portal.
  for (const portalId of Object.keys(registry.portals)) {
    try {
      const data = loadPortalKnowledge(portalId);
      if (!data.entries.includes(entry)) continue;
      const candidate = (data.manifest as typeof data.manifest & PortalRoleManifest).roles;
      if (!Array.isArray(candidate) || candidate.length === 0) return null;
      const policies = candidate.filter((policy): policy is RolePolicy =>
        !!policy && typeof policy.id === 'string' && Array.isArray(policy.allowedMenuPrefixes));
      if (policies.length !== candidate.length || policies.filter(p => p.leastPrivileged).length !== 1) return null;
      return policies;
    } catch { /* An unavailable other tenant must never broaden access. */ }
  }
  return null;
}

export function canReadEntry(entry: HelpEntry, role: GuideRole): boolean {
  const policies = roleForEntry(entry);
  if (!policies) return false;
  const policy = policies.find(p => p.id === role || p.aliases?.includes(role)) ||
    policies.find(p => p.leastPrivileged);
  if (!policy) return false;
  if (!policy.allowedMenuPrefixes.some(prefix => prefix === '*' || (prefix.length > 0 && entry.group.startsWith(prefix)))) return false;

  const allowedIds = policy.allowedIdsByGroup?.[entry.group];
  if (allowedIds && !allowedIds.includes(String(entry.raw.id ?? ''))) return false;
  const allowedHrefs = policy.allowedHrefsByGroup?.[entry.group];
  if (allowedHrefs && !allowedHrefs.includes(entry.href || '')) return false;
  const requiredAudience = policy.requiredAudienceByGroup?.[entry.group];
  if (requiredAudience && entry.audience !== requiredAudience) return false;
  const fields = policy.requiredAnyFieldsByGroup?.[entry.group];
  if (fields && !fields.some(key => typeof entry.raw[key] === 'string' && String(entry.raw[key]).trim().length > 0)) return false;
  return true;
}
