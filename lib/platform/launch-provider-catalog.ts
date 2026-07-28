/**
 * Launch provider catalog — single registration surface for optional / future
 * external engines. Does NOT create a second integrations dashboard.
 *
 * Health is exposed via platform ops (`/api/health/ops`).
 * Providers stay disabled until env is configured.
 *
 * @see docs/EA-Core-Technology-Stack.md
 * @see docs/INTEGRATION-GATE.md
 */

export type LaunchProviderTier = 'optional' | 'internal' | 'future';

export type LaunchProviderStatus =
  | 'disabled_not_configured'
  | 'configured'
  | 'not_installed'
  | 'internal_only';

export type LaunchProvider = {
  id: string;
  name: string;
  purpose: string;
  tier: LaunchProviderTier;
  /** Existing architecture slot — never a parallel system. */
  extensionPoint:
    | 'ai-gateway'
    | 'factory-research'
    | 'publishing-facade'
    | 'internal-dev'
    | 'future-queue';
  /** Env vars that enable the provider (all required for "configured"). */
  configEnvKeys: string[];
  customerFacing: boolean;
  usedBy: string[];
};

export const LAUNCH_PROVIDER_CATALOG: readonly LaunchProvider[] = [
  {
    id: 'omniroute',
    name: 'OmniRoute',
    purpose: 'AI model routing and orchestration for Launch, Simplifi, Amplifi, and Executive AI.',
    tier: 'optional',
    extensionPoint: 'ai-gateway',
    configEnvKeys: ['OMNIROUTE_API_KEY', 'OMNIROUTE_BASE_URL'],
    customerFacing: false,
    usedBy: ['Launch', 'Simplifi', 'Amplifi', 'Executive AI'],
  },
  {
    id: 'scrapling',
    name: 'Scrapling',
    purpose: 'Opportunity Intelligence collection — website analysis, org research, Executive Brief inputs.',
    tier: 'optional',
    extensionPoint: 'factory-research',
    configEnvKeys: ['SCRAPLING_API_KEY', 'SCRAPLING_BASE_URL'],
    customerFacing: false,
    usedBy: ['EA Factory research', 'Opportunity Intelligence'],
  },
  {
    id: 'onlook',
    name: 'Onlook',
    purpose: 'Internal visual editing workflow for builders. Never exposed to customers.',
    tier: 'internal',
    extensionPoint: 'internal-dev',
    configEnvKeys: [],
    customerFacing: false,
    usedBy: ['Engineering'],
  },
  {
    id: 'postiz',
    name: 'Postiz',
    purpose: 'Future invisible publishing engine for Amplifi Communications (not a customer product).',
    tier: 'future',
    extensionPoint: 'publishing-facade',
    configEnvKeys: [],
    customerFacing: false,
    usedBy: ['Amplifi Communications (future)'],
  },
  {
    id: 'cal-com',
    name: 'Cal.com',
    purpose: 'Future scheduling engine behind EA booking experiences.',
    tier: 'future',
    extensionPoint: 'future-queue',
    configEnvKeys: [],
    customerFacing: false,
    usedBy: ['Future scheduling'],
  },
  {
    id: 'openwa',
    name: 'OpenWA',
    purpose: 'Future WhatsApp campaign engine under Communications.',
    tier: 'future',
    extensionPoint: 'future-queue',
    configEnvKeys: [],
    customerFacing: false,
    usedBy: ['Amplifi Communications (future)'],
  },
  {
    id: 'voxcpm2',
    name: 'VoxCPM2',
    purpose: 'Future voice / narration engine.',
    tier: 'future',
    extensionPoint: 'future-queue',
    configEnvKeys: [],
    customerFacing: false,
    usedBy: ['Future media'],
  },
  {
    id: 'money-printer-turbo',
    name: 'MoneyPrinterTurbo',
    purpose: 'Future short-form video pipeline.',
    tier: 'future',
    extensionPoint: 'future-queue',
    configEnvKeys: [],
    customerFacing: false,
    usedBy: ['Future media'],
  },
] as const;

export type LaunchProviderHealth = {
  id: string;
  name: string;
  purpose: string;
  tier: LaunchProviderTier;
  status: LaunchProviderStatus;
  message: string;
  extensionPoint: LaunchProvider['extensionPoint'];
  customerFacing: boolean;
};

function envConfigured(keys: string[]): boolean {
  if (keys.length === 0) return false;
  return keys.every((key) => Boolean(process.env[key]?.trim()));
}

export function resolveLaunchProviderStatus(provider: LaunchProvider): LaunchProviderHealth {
  if (provider.tier === 'future') {
    return {
      id: provider.id,
      name: provider.name,
      purpose: provider.purpose,
      tier: provider.tier,
      status: 'not_installed',
      message: 'Not Installed — future queue only. No implementation.',
      extensionPoint: provider.extensionPoint,
      customerFacing: provider.customerFacing,
    };
  }

  if (provider.tier === 'internal') {
    return {
      id: provider.id,
      name: provider.name,
      purpose: provider.purpose,
      tier: provider.tier,
      status: 'internal_only',
      message: 'Internal developer tool — not a portal module; never customer-facing.',
      extensionPoint: provider.extensionPoint,
      customerFacing: false,
    };
  }

  if (envConfigured(provider.configEnvKeys)) {
    return {
      id: provider.id,
      name: provider.name,
      purpose: provider.purpose,
      tier: provider.tier,
      status: 'configured',
      message: `Configured via ${provider.configEnvKeys.join(', ')}. Runtime adapter may still be inactive until wired.`,
      extensionPoint: provider.extensionPoint,
      customerFacing: provider.customerFacing,
    };
  }

  return {
    id: provider.id,
    name: provider.name,
    purpose: provider.purpose,
    tier: provider.tier,
    status: 'disabled_not_configured',
    message: `Disabled until configured. Set: ${provider.configEnvKeys.join(', ') || '(none)'}`,
    extensionPoint: provider.extensionPoint,
    customerFacing: provider.customerFacing,
  };
}

export function listLaunchProviderHealth(): LaunchProviderHealth[] {
  return LAUNCH_PROVIDER_CATALOG.map(resolveLaunchProviderStatus);
}

/** Map catalog rows into platform-ops subsystem entries (optional engines only). */
export function launchProvidersAsOpsSubsystems(): Array<{
  id: string;
  name: string;
  status: 'healthy' | 'degraded' | 'critical' | 'unknown' | 'not_configured';
  message: string;
}> {
  return listLaunchProviderHealth()
    .filter((row) => row.tier === 'optional' || row.tier === 'internal')
    .map((row) => {
      let status: 'healthy' | 'degraded' | 'critical' | 'unknown' | 'not_configured' =
        'not_configured';
      if (row.status === 'configured') status = 'healthy';
      else if (row.status === 'internal_only') status = 'unknown';
      else status = 'not_configured';
      return {
        id: `provider:${row.id}`,
        name: row.name,
        status,
        message: row.message,
      };
    });
}
