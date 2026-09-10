import { readFile } from 'node:fs/promises';
import path from 'node:path';

const root = process.cwd();
const configPath = path.join(root, 'config', 'production-protection.json');
const config = JSON.parse(await readFile(configPath, 'utf8'));

let failures = 0;
const checked = [];

for (const client of config.clients || []) {
  for (const contract of client.sourceContracts || []) {
    const filePath = path.join(root, contract.path);
    let source = '';
    try {
      source = await readFile(filePath, 'utf8');
    } catch (error) {
      console.error(`[FAIL] ${client.id}: missing protected source ${contract.path}`);
      failures += 1;
      continue;
    }

    for (const marker of contract.mustContain || []) {
      if (!source.includes(marker)) {
        console.error(`[FAIL] ${client.id}: ${contract.path} missing required marker: ${marker}`);
        failures += 1;
      }
    }

    for (const marker of contract.mustNotContain || []) {
      if (source.includes(marker)) {
        console.error(`[FAIL] ${client.id}: ${contract.path} contains forbidden marker: ${marker}`);
        failures += 1;
      }
    }

    checked.push(contract.path);
  }
}

if (process.env.EA_PROTECTION_LIVE === 'true') {
  const platformOrigin = (process.env.EA_PLATFORM_ORIGIN || 'https://efficiencyarchitects.online').replace(/\/$/, '');

  for (const client of config.clients || []) {
    for (const url of client.publicUrls || []) {
      try {
        const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
        if (!response.ok) {
          console.error(`[FAIL] ${client.id}: ${url} returned ${response.status}`);
          failures += 1;
        }
      } catch (error) {
        console.error(`[FAIL] ${client.id}: ${url} unavailable: ${error instanceof Error ? error.message : String(error)}`);
        failures += 1;
      }
    }

    for (const route of client.platformRoutes || []) {
      const url = `${platformOrigin}${route.startsWith('/') ? route : `/${route}`}`;
      try {
        const response = await fetch(url, { redirect: 'follow', signal: AbortSignal.timeout(30000) });
        if (!response.ok) {
          console.error(`[FAIL] ${client.id}: ${url} returned ${response.status}`);
          failures += 1;
        }
      } catch (error) {
        console.error(`[FAIL] ${client.id}: ${url} unavailable: ${error instanceof Error ? error.message : String(error)}`);
        failures += 1;
      }
    }

    if (client.healthEndpoint) {
      const url = `${platformOrigin}${client.healthEndpoint}`;
      try {
        const response = await fetch(url, { cache: 'no-store', signal: AbortSignal.timeout(45000) });
        const body = await response.json().catch(() => ({}));
        if (!response.ok || body.ok !== true) {
          console.error(`[FAIL] ${client.id}: health endpoint failed (${response.status})`);
          failures += 1;
        }
        for (const key of client.requiredHealthChecks || []) {
          if (body?.checks?.[key] !== true) {
            console.error(`[FAIL] ${client.id}: health check ${key} is not true`);
            failures += 1;
          }
        }
        const unavailableMaterials = Object.entries(body?.materialInventory || {})
          .filter(([, item]) => item?.available !== true)
          .map(([id]) => id);
        if (unavailableMaterials.length) {
          console.error(`[FAIL] ${client.id}: unavailable private course materials: ${unavailableMaterials.join(', ')}`);
          failures += 1;
        }
      } catch (error) {
        console.error(`[FAIL] ${client.id}: health endpoint unavailable: ${error instanceof Error ? error.message : String(error)}`);
        failures += 1;
      }
    }
  }
}

if (failures) {
  console.error(`EA Production Protection: FAIL (${failures} issue${failures === 1 ? '' : 's'})`);
  process.exit(1);
}

console.log(`EA Production Protection: PASS (${config.clients?.length || 0} client profile(s), ${checked.length} protected source contract(s))`);
