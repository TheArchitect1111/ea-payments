/**
 * Simplifi Opportunity OS — feature flags.
 * All new capabilities default OFF and fail closed to current production behavior.
 * Do not enable SIMPLIFI_OS_READ in this Phase 1 slice.
 */

export function isSimplifiOsWriteEnabled(): boolean {
  return process.env.SIMPLIFI_OS_WRITE === '1';
}

export function isSimplifiOsReadEnabled(): boolean {
  return process.env.SIMPLIFI_OS_READ === '1';
}

export function isSimplifiEmbedEnabled(): boolean {
  return process.env.SIMPLIFI_EMBED === '1';
}

export function isSimplifiSemanticAskEnabled(): boolean {
  return process.env.SIMPLIFI_SEMANTIC_ASK === '1';
}

export function isSimplifiIntelligenceEnabled(): boolean {
  return process.env.SIMPLIFI_INTELLIGENCE === '1';
}

export function isSimplifiBriefIntelEnabled(): boolean {
  return process.env.SIMPLIFI_BRIEF_INTEL === '1';
}

export function isSimplifiAmbientEnabled(): boolean {
  return process.env.SIMPLIFI_AMBIENT !== '0';
}

export function isSimplifiOsConfigured(): boolean {
  return Boolean(
    process.env.SUPABASE_URL?.trim() &&
      (process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() || process.env.SUPABASE_SERVICE_KEY?.trim()),
  );
}
