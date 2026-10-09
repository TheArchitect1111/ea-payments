import { cookies } from 'next/headers';
import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import { EA_ADMIN_COOKIE, parseAdminSession } from '@/lib/ea-admin-auth';
import { can, normalizeAdminRole } from '@/lib/rbac';
import PhoneHq from './PhoneHq';
import routeIndex from '../../data/hq-pages-index.json';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteEntry = { path: string; label: string };

function labelFor(path: string) {
  return path === '/' ? 'Home' : path.replace(/\[(.*?)\]/g, '$1').replace(/[-_/]+/g, ' ').trim()
    .replace(/\b\w/g, (character) => character.toUpperCase());
}
function normalizeRoute(path: string) {
  const clean = path.replace(/\/page(?:\.(?:tsx?|jsx?))?$/, '').replace(/\/+/g, '/');
  return clean === '' ? '/' : clean.startsWith('/') ? clean : '/' + clean;
}
async function discoverRoutes(): Promise<RouteEntry[]> {
  const routes = new Map<string, RouteEntry>();
  const add = (path: string) => {
    const normalized = normalizeRoute(path);
    if (normalized === '/hq' || normalized.startsWith('/api/') || normalized === '/api') return;
    if (normalized.includes('(') || normalized.includes(')')) return;
    routes.set(normalized, { path: normalized, label: labelFor(normalized) });
  };
  try {
    const manifest = JSON.parse(await readFile(join(process.cwd(), '.next/server/app-paths-manifest.json'), 'utf8')) as Record<string, string>;
    for (const route of Object.keys(manifest)) add(route);
  } catch {
    try {
      const { readdir } = await import('node:fs/promises');
      const walk = async (directory: string, segments: string[] = []): Promise<void> => {
        const entries = await readdir(directory, { withFileTypes: true });
        for (const entry of entries) {
          if (entry.isDirectory()) await walk(join(directory, entry.name), [...segments, entry.name]);
          else if (/^page\.(tsx?|jsx?)$/.test(entry.name)) add('/' + segments.join('/'));
        }
      };
      await walk(join(process.cwd(), 'app'));
    } catch { /* Source files may be omitted from deployed functions. */ }
  }
  if (routes.size === 0) for (const entry of routeIndex as RouteEntry[]) add(entry.path);
  return [...routes.values()].sort((a, b) => a.path.localeCompare(b.path));
}

export default async function HqPage() {
  const cookieStore = await cookies();
  const session = parseAdminSession(cookieStore.get(EA_ADMIN_COOKIE)?.value);
  const adminMode = Boolean(session && can(normalizeAdminRole(session.role), 'admin:access'));
  if (!adminMode) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#0a0a0a] px-4 text-white">
        <section className="w-full max-w-md rounded-3xl border border-white/15 bg-[#141414] p-6 text-center">
          <h1 className="text-3xl font-black">My Projects HQ</h1>
          <p className="mt-2 text-lg font-bold text-white/70">Fix Anything</p>
          <p className="mt-4 text-sm leading-6 text-white/65">Sign in with an EA admin account to edit and publish pages.</p>
          <a href="/admin/login?next=%2Fhq" className="mt-5 grid min-h-20 place-items-center rounded-2xl bg-[#a51c30] px-4 font-black">Sign in to HQ</a>
        </section>
      </main>
    );
  }
  return <PhoneHq routes={await discoverRoutes()} />;
}
