export type FeatureFlagName =
  | 'factory_durable_retries'
  | 'provider_circuit_breakers'
  | 'control_plane_reconciliation'
  | 'automatic_factory_chaining';

const DEFAULTS: Record<FeatureFlagName, boolean> = {
  factory_durable_retries: true,
  provider_circuit_breakers: true,
  control_plane_reconciliation: true,
  automatic_factory_chaining: true,
};

function envName(flag: FeatureFlagName): string {
  return `EA_FLAG_${flag.toUpperCase()}`;
}

export function featureEnabled(flag: FeatureFlagName): boolean {
  const raw = process.env[envName(flag)];
  if (raw == null || raw.trim() === '') return DEFAULTS[flag];
  const value = raw.trim().toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(value)) return true;
  if (['0', 'false', 'no', 'off'].includes(value)) return false;
  return false;
}

export function featureFlagSnapshot(): Record<FeatureFlagName, boolean> {
  return {
    factory_durable_retries: featureEnabled('factory_durable_retries'),
    provider_circuit_breakers: featureEnabled('provider_circuit_breakers'),
    control_plane_reconciliation: featureEnabled('control_plane_reconciliation'),
    automatic_factory_chaining: featureEnabled('automatic_factory_chaining'),
  };
}
