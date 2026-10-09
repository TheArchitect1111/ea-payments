import { cookies } from 'next/headers';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import { can, normalizeAdminRole } from '@/lib/rbac';
import PhoneHq from './PhoneHq';
import routeIndex from '../../data/hq-pages-index.json';
import projectIndex from '../../data/hq-projects-index.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteEntry = { path: string; label: string };
type ProjectEntry = { id: string; name: string; domain: string; route: string; features: string[] };
function normalizeRoute(path: string) {
  const clean = path.replace(/\/page(?:\.(?:tsx?|jsx?))?$/, '').replace(/\/+/g, '/');
  return clean === '' ? '/' : clean.startsWith('/') ? clean : '/' + clean;
}
function labelFor(path: string) {
  return path === '/' ? 'Home' : path.replace(/\[(.*?)\]/g, '$1').replace(/[-_/]+/g, ' ').trim().replace(/\b\w/g, (character) => character.toUpperCase());
}
function readJson(path: string): Record<string, unknown> | null {
  try { return JSON.parse(readFileSync(path, 'utf8')) as Record<string, unknown>; } catch { return null; }
}
function discoverProjects(): ProjectEntry[] {
  const found = new Map<string, ProjectEntry>();
  try {
    for (const entry of readdirSync(join(process.cwd(), 'clients'), { withFileTypes: true })) {
      if (!entry.isDirectory()) continue;
      const file = readJson(join(process.cwd(), 'clients', entry.name, 'client.json'));
      if (!file) continue;
      const id = typeof file.id === 'string' ? file.id : entry.name;
      if (!/^[a-z0-9][a-z0-9-]{0,48}$/.test(id)) continue;
      const canonical = typeof file.canonical === 'object' && file.canonical ? file.canonical as Record<string, unknown> : {};
      const features = Array.isArray(file.hqFeatures) ? file.hqFeatures.filter((value): value is string => typeof value === 'string') : [];
      const route = typeof canonical.portalRoute === 'string' ? canonical.portalRoute : typeof canonical.publicSiteRoute === 'string' ? canonical.publicSiteRoute : '/client/' + id;
      found.set(id, { id, name: typeof file.name === 'string' ? file.name : labelFor(id), domain: typeof canonical.publicDomain === 'string' ? canonical.publicDomain.replace(/^https?:\/\//, '') : '', route, features });
    }
  } catch { /* The generated registry covers deployments that omit source files. */ }
  for (const item of projectIndex as ProjectEntry[]) if (!found.has(item.id)) found.set(item.id, item);
  return [...found.values()].sort((a, b) => a.name.localeCompare(b.name));
}
function discoverRoutes(): RouteEntry[] {
  const routes = new Map<string, RouteEntry>();
  const add = (path: string, label = labelFor(normalizeRoute(path))) => {
    const normalized = normalizeRoute(path);
    if (normalized === '/hq' || normalized === '/api' || normalized.startsWith('/api/')) return;
    if (normalized.includes('(') || normalized.includes(')')) return;
    routes.set(normalized, { path: normalized, label });
  };
  try {
    const manifest = JSON.parse(readFileSync(join(process.cwd(), '.next/server/app-paths-manifest.json'), 'utf8')) as Record<string, string>;
    for (const [route, file] of Object.entries(manifest)) if (route.endsWith('/page') || route === '/page' || /(?:^|\/)page\.js$/.test(file)) add(route);
  } catch {
    const walk = (directory: string, segments: string[] = []): void => {
      if (!existsSync(directory)) return;
      try {
        for (const entry of readdirSync(directory, { withFileTypes: true })) {
          if (entry.isDirectory()) walk(join(directory, entry.name), [...segments, entry.name]);
          else if (/^page\.(tsx?|jsx?)$/.test(entry.name)) add('/' + segments.join('/'));
        }
      } catch { /* Keep routes discovered before a missing folder. */ }
    };
    walk(join(process.cwd(), 'app'));
  }
  if (routes.size === 0) for (const entry of routeIndex as RouteEntry[]) add(entry.path, entry.label);
  return [...routes.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export default async function HqPage() {
  const cookieStore = await cookies();
  const session = parseAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  const adminMode = Boolean(session && can(normalizeAdminRole(session.role), 'admin:access'));
  if (!adminMode) {
    return <main className="grid min-h-screen place-items-center bg-[#0a0a0a] px-4 text-white"><section className="w-full max-w-md rounded-3xl border border-white/15 bg-[#141414] p-6 text-center"><h1 className="text-3xl font-black">My Projects HQ</h1><p className="mt-2 text-lg font-bold text-white/70">Fix Anything</p><p className="mt-4 text-sm leading-6 text-white/65">Sign in with an EA admin account to edit and publish pages.</p><a href="/admin/login?next=%2Fhq" className="mt-5 grid min-h-20 place-items-center rounded-2xl bg-[#a51c30] px-4 font-black">Sign in to HQ</a></section></main>;
  }
  return <PhoneHq routes={discoverRoutes()} projects={discoverProjects()} />;
}
