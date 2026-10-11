import evidence from '@/config/portable-brick-evidence.json';
import contract from '@/config/module-certification-contract.json';
import { AMANDA_BRICK_MODULES, AmandaInstallSchema, installAmandaBrick, type BrickTenant } from './amanda';

/** Composite install entries use the existing certified module IDs, never invented entitlements. */
export const PORTABLE_BRICK_REGISTRY = {
  amanda: { id: 'amanda', version: 1, title: 'Enrollment, payment and confirmation',
    moduleIds: AMANDA_BRICK_MODULES, validate: (config: unknown) => AmandaInstallSchema.parse(config),
    install: installAmandaBrick, evidence },
} as const;
export type BrickSelection = { id: 'amanda'; config: unknown };
export function requireBrickSelections(selections: readonly BrickSelection[] = []) {
  if (new Set(selections.map(x => x.id)).size !== selections.length) throw new Error('Duplicate brick selection');
  return selections.map(selection => {
    const entry = PORTABLE_BRICK_REGISTRY[selection.id];
    if (!entry) throw new Error('Unknown portable brick');
    if (entry.evidence.moduleVersion !== entry.version || entry.evidence.status !== 'branch-verified' ||
        contract.requiredEvidenceClasses.some(cls => !entry.evidence.evidence[cls as keyof typeof entry.evidence.evidence]?.tests.length))
      throw new Error('Portable brick evidence is incomplete');
    return { entry, config: entry.validate(selection.config) };
  });
}
export async function installSelectedBricks(tenant: BrickTenant, selections: readonly BrickSelection[] = []) {
  for (const { entry, config } of requireBrickSelections(selections)) await entry.install(tenant, config);
}
