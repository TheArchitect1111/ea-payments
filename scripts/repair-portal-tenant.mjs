/**
 * Repair portalTenant codemod: fix auth.tenant.* and missing tenant declarations.
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

for (const file of walk(portalApi)) {
  let src = fs.readFileSync(file, 'utf8');
  if (!src.includes('portalTenant')) continue;

  src = src.replace(/\bauth\.tenant\.portalSlug\b/g, 'tenant.portalSlug');
  src = src.replace(/\bauth\.tenant\.organizationId\b/g, 'tenant.organizationId');

  if (src.includes('tenant.portalSlug') || src.includes('tenant.organizationId')) {
    if (!src.includes('const tenant = portalTenant(auth.session)')) {
      src = src.replace(
        /(if \(!auth\.ok\) return portalApiUnauthorized\(auth\);)\n/,
        '$1\n  const tenant = portalTenant(auth.session);\n',
      );
    }
  }

  // Ensure portalTenant import
  if (src.includes('portalTenant(') && !src.includes('portalTenant }')) {
    src = src.replace(
      /import \{([^}]+)\} from '@\/lib\/api\/portal-route';/,
      (match, imports) => {
        const parts = imports.split(',').map((s) => s.trim()).filter(Boolean);
        if (!parts.includes('portalTenant')) parts.push('portalTenant');
        return `import { ${parts.join(', ')} } from '@/lib/api/portal-route';`;
      },
    );
  }

  fs.writeFileSync(file, src);
}

// enhancements route — manual pattern
const enhancements = path.join(portalApi, 'enhancements', 'route.ts');
let enh = fs.readFileSync(enhancements, 'utf8');
if (!enh.includes('portalTenant')) {
  enh = enh.replace(
    "import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';",
    "import { guardPortalApi, portalApiUnauthorized, portalTenant } from '@/lib/api/portal-route';",
  );
  enh = enh.replace(
    /if \(!auth\.ok\) return portalApiUnauthorized\(auth\);\n  const session = auth\.session;/,
    'if (!auth.ok) return portalApiUnauthorized(auth);\n  const tenant = portalTenant(auth.session);\n  const session = auth.session;',
  );
  enh = enh.replace(/\bsession\.slug\b/g, 'tenant.portalSlug');
  fs.writeFileSync(enhancements, enh);
}

console.log('repair complete');
