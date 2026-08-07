import type { FactoryProject } from '@/lib/factory-project-store';

/** Mirror Factory concept preview slug rules without importing the full previews module. */
export function portalSlugFromClientLike(project: FactoryProject, override?: string): string {
  if (override?.trim()) return override.trim().toLowerCase();
  const client = project.client.trim().toLowerCase();
  if (client.includes('amanda')) return 'amanda-catherine';
  const raw = (project.client || project.id).trim().toLowerCase();
  const base = raw
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 28);
  const suffix = project.id.replace(/[^a-z0-9]/gi, '').slice(-6).toLowerCase() || 'site';
  return `${base || 'client'}-${suffix}`;
}
