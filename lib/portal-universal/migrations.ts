import type { IndustryPack } from '@/lib/portal-universal/industry-pack';
import { validateIndustryPack } from '@/lib/portal-universal/validate-pack';

/**
 * Migrate unknown pack JSON to current IndustryPack shape (additive defaults).
 */
export function migrateIndustryPack(raw: unknown): IndustryPack {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    throw new Error('migrateIndustryPack: expected object');
  }

  const input = { ...(raw as Record<string, unknown>) };

  if (Array.isArray(input.nav)) {
    input.nav = input.nav.map((item) => {
      if (!item || typeof item !== 'object') return item;
      const row = { ...(item as Record<string, unknown>) };
      if (row.visibility == null) {
        row.visibility = { kind: 'when_entitled' };
      }
      return row;
    });
  }

  if (input.extensions == null) {
    input.extensions = {
      people: { enabled: false },
      tasks: { enabled: false },
      notifications: { enabled: false },
    };
  }

  const result = validateIndustryPack(input, { phase1Strict: true });
  if (!result.ok) {
    throw new Error(`migrateIndustryPack failed: ${result.errors.join('; ')}`);
  }
  return result.pack;
}
