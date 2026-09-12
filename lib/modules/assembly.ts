import capabilityInventory from '@/config/capability-inventory.json';
import {
  CHASSIS_STANDARD_MODULE_IDS,
  MODULE_IDS,
  type ModuleId,
} from '@/lib/modules/registry';

type AssemblyStatus = 'certified' | 'inventoried' | 'review-required';

type InventoryCapability = {
  id: string;
  class: 'core' | 'business' | 'specialized';
  assemblyStatus: AssemblyStatus;
  costLicense?: { decision?: string };
};

export type AssemblyRejection = {
  id: string;
  reason: 'unknown-module' | 'not-certified' | 'cost-license-not-approved';
  status?: AssemblyStatus;
};

export type AssemblyPlan = {
  requested: string[];
  admitted: ModuleId[];
  rejected: AssemblyRejection[];
  blocked: boolean;
};

const INVENTORY_BY_ID = new Map(
  (capabilityInventory.modules as InventoryCapability[]).map((capability) => [capability.id, capability]),
);
const KNOWN_MODULE_IDS = new Set<string>(MODULE_IDS);

function isCertifiedForAssembly(id: ModuleId): boolean {
  const capability = INVENTORY_BY_ID.get(id);
  return (
    capability?.assemblyStatus === 'certified' &&
    capability.costLicense?.decision === 'approved'
  );
}

/**
 * Builds a deterministic, fail-closed assembly plan.
 * Certified chassis modules are always present. Requested modules are admitted
 * only when both assembly certification and cost/license approval are explicit.
 */
export function createAssemblyPlan(requestedIds: readonly string[]): AssemblyPlan {
  const requested = [...new Set(requestedIds)];
  const admitted = new Set<ModuleId>(CHASSIS_STANDARD_MODULE_IDS);
  const rejected: AssemblyRejection[] = [];

  for (const id of requested) {
    if (!KNOWN_MODULE_IDS.has(id)) {
      rejected.push({ id, reason: 'unknown-module' });
      continue;
    }

    const moduleId = id as ModuleId;
    const capability = INVENTORY_BY_ID.get(moduleId);
    if (capability?.assemblyStatus !== 'certified') {
      rejected.push({
        id,
        reason: 'not-certified',
        status: capability?.assemblyStatus,
      });
      continue;
    }

    if (capability.costLicense?.decision !== 'approved') {
      rejected.push({
        id,
        reason: 'cost-license-not-approved',
        status: capability.assemblyStatus,
      });
      continue;
    }

    admitted.add(moduleId);
  }

  return {
    requested,
    admitted: [...admitted],
    rejected,
    blocked: rejected.length > 0,
  };
}

/** Fail closed for provisioning callers. */
export function requireAssemblyPlan(requestedIds: readonly string[]): AssemblyPlan {
  const plan = createAssemblyPlan(requestedIds);
  if (plan.blocked) {
    const detail = plan.rejected.map((item) => `${item.id}:${item.reason}`).join(', ');
    throw new Error(`EA assembly blocked: ${detail}`);
  }
  return plan;
}
