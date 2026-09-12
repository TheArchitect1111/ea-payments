import policy from '@/config/release-guardrails.json';

export type EaKillSwitchId = (typeof policy.killSwitches)[number]['id'];

export function isEaCapabilityKilled(id: EaKillSwitchId): boolean {
  const entry = policy.killSwitches.find((item) => item.id === id);
  if (!entry) return true;
  const raw = process.env[entry.environmentVariable];
  if (raw == null || raw === '') return entry.safeDefault === true;
  return /^(1|true|yes|on)$/i.test(raw);
}

export function assertEaCapabilityEnabled(id: EaKillSwitchId): void {
  if (isEaCapabilityKilled(id)) {
    throw new Error(`EA capability disabled by release guardrail: ${id}`);
  }
}

export function getEaReleasePolicy() {
  return policy;
}
