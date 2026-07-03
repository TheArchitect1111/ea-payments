/**
 * One-shot codemod: inject portalTenant() into guarded portal API routes.
 * Usage: node scripts/wire-portal-tenant.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const portalApi = path.join(root, 'app', 'api', 'portal');

function walk(dir) {
  const out = [];
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, name.name);
    if (name.isDirectory()) out.push(...walk(full));
    else if (name.name === 'route.ts') out.push(full);
  }
  return out;
}

const skip = new Set([
  'login', 'logout', 'register', 'clerk-bridge', 'password-reset', 'enhance',
]);

for (const file of walk(portalApi)) {
  const rel = path.relative(portalApi, file).replace(/\\/g, '/');
  if ([...skip].some((s) => rel.includes(s))) continue;

  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('guardPortalApi')) continue;
  if (src.includes('portalTenant(')) continue;

  src = src.replace(
    /import \{([^}]+)\} from '@\/lib\/api\/portal-route';/,
    (match, imports) => {
      const parts = imports.split(',').map((s) => s.trim()).filter(Boolean);
      if (!parts.includes('portalTenant')) parts.push('portalTenant');
      return `import { ${parts.join(', ')} } from '@/lib/api/portal-route';`;
    },
  );

  // Insert tenant after first successful auth block
  src = src.replace(
    /(if \(!auth\.ok\) return portalApiUnauthorized\(auth\);)\n(\s*)(const session = auth\.session;)?/,
    '$1\n$2const tenant = portalTenant(auth.session);\n$2const session = auth.session;',
  );

  src = src.replace(/\bsession\.slug\b/g, 'tenant.portalSlug');
  src = src.replace(/\bsession\.orgId\b/g, 'tenant.organizationId');
  src = src.replace(/\bauth\.session\.slug\b/g, 'tenant.portalSlug');
  src = src.replace(/\borgSlug: tenant\.portalSlug\b/g, 'orgSlug: tenant.portalSlug');

  fs.writeFileSync(file, src);
  console.log('updated', rel);
}
