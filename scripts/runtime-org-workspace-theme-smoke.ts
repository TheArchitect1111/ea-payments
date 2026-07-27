/**
 * Smoke: updateOrganizationWorkspaceConfig against thin Organizations schema.
 * Run: npx --yes tsx scripts/runtime-org-workspace-theme-smoke.ts
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  getOrganizationById,
  updateOrganizationWorkspaceConfig,
} from '../lib/organizations';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
function loadEnv(path: string) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split(/\r?\n/)) {
    if (!line || line.startsWith('#') || !line.includes('=')) continue;
    const i = line.indexOf('=');
    const key = line.slice(0, i).trim();
    let value = line.slice(i + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}
loadEnv(join(root, '..', 'ea-payments', '.env.local'));
loadEnv(join(root, '.env.local'));

async function main() {
  const orgId = process.env.EA_ORG_ID?.trim() || 'rec4RdtA5S8XVIW0z';
  const updated = await updateOrganizationWorkspaceConfig(orgId, {
    themeId: 'amanda-editorial',
    personalityId: 'creative',
    workspaceName: 'Amanda Catherine Experience',
    brandColors: JSON.stringify({ primary: '#17130F', accent: '#B9894D' }),
  });
  const reloaded = await getOrganizationById(orgId);

  const ok =
    Boolean(updated?.themeId === 'amanda-editorial') &&
    Boolean(reloaded?.themeId === 'amanda-editorial');

  console.log(
    JSON.stringify(
      {
        ok,
        orgId,
        updatedThemeId: updated?.themeId,
        reloadedThemeId: reloaded?.themeId,
        workspaceName: reloaded?.workspaceName,
      },
      null,
      2,
    ),
  );
  process.exit(ok ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
