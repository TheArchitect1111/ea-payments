/**
 * Platform package sync health — vendor presence + optional OS drift.
 * Source of truth: ea-operating-system. Consumers sync into vendor/.
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export const PLATFORM_VENDOR_PACKAGES = [
  'capability-registry',
  'module-engine',
  'theme-engine',
  'personality-engine',
  'website-engine',
  'workspace-engine',
  'payments-contract',
] as const;

export const CHASSIS_VENDOR_PACKAGES = ['portal-chassis', 'premium-chassis'] as const;

export type VendorPackageName =
  | (typeof PLATFORM_VENDOR_PACKAGES)[number]
  | (typeof CHASSIS_VENDOR_PACKAGES)[number];

export type PackageSyncRow = {
  name: VendorPackageName;
  kind: 'platform' | 'chassis';
  vendorPath: string;
  present: boolean;
  vendorVersion: string | null;
  osVersion: string | null;
  versionMatch: boolean | null;
  /** Content fingerprint drift for a sentinel source file (null if OS unavailable). */
  contentMatch: boolean | null;
  detail: string;
  ok: boolean;
};

function projectRoot(): string {
  return process.cwd();
}

function resolveOsPackagesRoot(): string | null {
  const root = projectRoot();
  const candidates = [
    join(root, '../../ea-operating-system/packages'),
    join(root, '../ea-operating-system/packages'),
  ];
  return candidates.find((p) => existsSync(p)) ?? null;
}

function resolveOsChassisRoot(): string | null {
  const root = projectRoot();
  const candidates = [
    join(root, '../../ea-operating-system'),
    join(root, '../ea-operating-system'),
  ];
  return candidates.find((p) => existsSync(join(p, 'portal-core')) || existsSync(join(p, 'premium-chassis'))) ?? null;
}

function readJsonVersion(pkgJsonPath: string): string | null {
  if (!existsSync(pkgJsonPath)) return null;
  try {
    const pkg = JSON.parse(readFileSync(pkgJsonPath, 'utf8')) as { version?: string };
    return typeof pkg.version === 'string' ? pkg.version : null;
  } catch {
    return null;
  }
}

function normalizeSourceForFingerprint(raw: string): string {
  return raw
    .replace(/\r\n/g, '\n')
    .replace(/(from\s+['"])(\.\.?\/[^'"]+)\.js(['"])/g, '$1$2$3');
}

function fingerprintNormalized(path: string): string | null {
  if (!existsSync(path)) return null;
  try {
    return createHash('sha256')
      .update(normalizeSourceForFingerprint(readFileSync(path, 'utf8')))
      .digest('hex')
      .slice(0, 12);
  } catch {
    return null;
  }
}

/** Sentinel files used to detect vendor drift vs OS (platform packages). */
const PLATFORM_SENTINELS: Partial<Record<(typeof PLATFORM_VENDOR_PACKAGES)[number], string>> = {
  'capability-registry': 'src/id-map.ts',
  'module-engine': 'src/index.ts',
  'theme-engine': 'src/index.ts',
  'personality-engine': 'src/index.ts',
  'website-engine': 'src/index.ts',
  'workspace-engine': 'src/index.ts',
  'payments-contract': 'src/offers.ts',
};

function rowForPlatform(
  name: (typeof PLATFORM_VENDOR_PACKAGES)[number],
  osPackagesRoot: string | null,
): PackageSyncRow {
  const vendorPath = join(projectRoot(), 'vendor', name);
  const present =
    existsSync(join(vendorPath, 'package.json')) && existsSync(join(vendorPath, 'src'));
  const vendorVersion = present ? readJsonVersion(join(vendorPath, 'package.json')) : null;

  let osVersion: string | null = null;
  let versionMatch: boolean | null = null;
  let contentMatch: boolean | null = null;

  if (osPackagesRoot) {
    const osPkg = join(osPackagesRoot, name);
    osVersion = readJsonVersion(join(osPkg, 'package.json'));
    if (vendorVersion && osVersion) versionMatch = vendorVersion === osVersion;

    const sentinel = PLATFORM_SENTINELS[name];
    if (sentinel) {
      const vendorFp = fingerprintNormalized(join(vendorPath, sentinel));
      const osFp = fingerprintNormalized(join(osPkg, sentinel));
      if (vendorFp && osFp) contentMatch = vendorFp === osFp;
    }
  }

  const ok =
    present && versionMatch !== false && contentMatch !== false;

  const parts: string[] = [];
  if (!present) parts.push('missing vendor copy');
  else parts.push(`v${vendorVersion ?? '?'}`);
  if (osPackagesRoot) {
    if (versionMatch === false) parts.push(`OS v${osVersion} differs`);
    if (contentMatch === false) {
      parts.push('content drift — run npm run sync-platform-packages');
    }
    if (versionMatch === true && contentMatch === true) parts.push('in sync with OS');
    if (versionMatch === true && contentMatch === null) parts.push('version matches OS');
  } else {
    parts.push('OS checkout not available (vendor-only check)');
  }

  return {
    name,
    kind: 'platform',
    vendorPath: `vendor/${name}`,
    present,
    vendorVersion,
    osVersion,
    versionMatch,
    contentMatch,
    detail: parts.join(' · '),
    ok,
  };
}

function rowForChassis(
  name: (typeof CHASSIS_VENDOR_PACKAGES)[number],
  osRoot: string | null,
): PackageSyncRow {
  const vendorPath = join(projectRoot(), 'vendor', name);
  const present = existsSync(join(vendorPath, 'package.json'));
  const vendorVersion = present ? readJsonVersion(join(vendorPath, 'package.json')) : null;

  let osVersion: string | null = null;
  let versionMatch: boolean | null = null;

  if (osRoot) {
    const osPkgJson =
      name === 'portal-chassis'
        ? join(osRoot, 'portal-core/package.json')
        : join(osRoot, 'premium-chassis/package.json');
    osVersion = readJsonVersion(osPkgJson);
    if (vendorVersion && osVersion) versionMatch = vendorVersion === osVersion;
  }

  const ok = present && versionMatch !== false;
  const parts: string[] = [];
  if (!present) parts.push('missing vendor copy');
  else parts.push(`v${vendorVersion ?? '?'}`);
  if (osRoot) {
    if (versionMatch === false) parts.push(`OS v${osVersion} differs — run sync-chassis`);
    if (versionMatch === true) parts.push('version matches OS');
  } else {
    parts.push('OS checkout not available');
  }

  return {
    name,
    kind: 'chassis',
    vendorPath: `vendor/${name}`,
    present,
    vendorVersion,
    osVersion,
    versionMatch,
    contentMatch: null,
    detail: parts.join(' · '),
    ok,
  };
}

export function getPackageSyncHealth() {
  const osPackagesRoot = resolveOsPackagesRoot();
  const osRoot = resolveOsChassisRoot();

  const platform = PLATFORM_VENDOR_PACKAGES.map((name) =>
    rowForPlatform(name, osPackagesRoot),
  );
  const chassis = CHASSIS_VENDOR_PACKAGES.map((name) => rowForChassis(name, osRoot));
  const packages = [...platform, ...chassis];

  const missing = packages.filter((p) => !p.present).map((p) => p.name);
  const drifted = packages
    .filter(
      (p) =>
        p.present && (p.versionMatch === false || p.contentMatch === false),
    )
    .map((p) => p.name);

  const ok = packages.every((p) => p.ok);

  return {
    ok,
    osAvailable: Boolean(osPackagesRoot || osRoot),
    packageCount: packages.length,
    presentCount: packages.filter((p) => p.present).length,
    missing,
    drifted,
    packages,
    syncHint: drifted.length
      ? 'Run npm run sync-platform-packages (and sync-chassis / sync-premium if chassis drifted).'
      : missing.length
        ? 'Vendor copies missing — run npm run sync-platform-packages.'
        : 'Vendor packages present.',
  };
}
