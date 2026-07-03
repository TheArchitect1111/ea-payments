import fs from 'fs';
import path from 'path';

const portalApiDir = 'app/api/portal';

function walk(dir) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, ent.name);
    if (ent.isDirectory()) walk(p);
    else if (ent.name === 'route.ts') migrateFile(p);
  }
}

function migrateFile(filePath) {
  let c = fs.readFileSync(filePath, 'utf8');
  const orig = c;

  if (!c.includes('requirePortalSession')) return;

  c = c.replace(
    /import \{ requirePortalSessionFromRequest \} from '@\/lib\/auth\/resolve-portal-session';/g,
    "import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';",
  );
  c = c.replace(
    /import \{ requirePortalSession \} from '@\/lib\/auth\/resolve-portal-session';/g,
    "import { guardPortalApiCookie, portalApiUnauthorized } from '@/lib/api/portal-route';",
  );

  // Both imports in same file (unlikely)
  if (c.includes('requirePortalSessionFromRequest')) {
    c = c.replace(
      /import \{ requirePortalSessionFromRequest \} from '@\/lib\/auth\/resolve-portal-session';/g,
      "import { guardPortalApi, portalApiUnauthorized } from '@/lib/api/portal-route';",
    );
  }

  c = c.replace(
    /const session = await requirePortalSessionFromRequest\(req(?:, (\{[^}]+\}))?\);\s*if \(!session\) \{\s*return NextResponse\.json\([^}]+\}, \{ status: 401 \}\);\s*\}/g,
    'const auth = await guardPortalApi(req$1);\n  if (!auth.ok) return portalApiUnauthorized(auth);\n  const session = auth.session;',
  );

  c = c.replace(
    /const session = await requirePortalSession\((\{[^}]+\})?\);\s*if \(!session\) \{\s*return NextResponse\.json\([^}]+\}, \{ status: 401 \}\);\s*\}/g,
    'const auth = await guardPortalApiCookie($1);\n  if (!auth.ok) return portalApiUnauthorized(auth);\n  const session = auth.session;',
  );

  // content-requests helper pattern
  c = c.replace(
    /async function authenticatedClient\(\) \{\s*const session = await requirePortalSession\(\);\s*if \(!session\) return null;\s*return getClientByPortalSlug\(session\.slug\);\s*\}/g,
    `async function authenticatedClient() {
  const auth = await guardPortalApiCookie();
  if (!auth.ok) return null;
  return getClientByPortalSlug(auth.session.slug);
}`,
  );

  if (c !== orig) {
    fs.writeFileSync(filePath, c);
    console.log('migrated', filePath);
  }
}

walk(portalApiDir);
