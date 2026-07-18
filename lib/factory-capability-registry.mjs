/**
 * Pure CapabilityRegistry — registration + discovery (unit-tested from Node).
 * Orchestrator uses discoverNextCapability; workers never call each other.
 */

/**
 * @returns {{
 *   register: (capability: object) => void,
 *   get: (id: string) => object | null,
 *   list: () => object[],
 *   clear: () => void,
 *   size: () => number,
 *   discoverNext: (context: object, options?: { orderIds?: string[] }) => object | null,
 * }}
 */
export function createCapabilityRegistry() {
  /** @type {Map<string, object>} */
  const byId = new Map();

  return {
    register(capability) {
      if (!capability?.id || typeof capability.id !== 'string') {
        throw new Error('Capability requires a string id');
      }
      if (!Array.isArray(capability.dependencies)) {
        throw new Error(`Capability ${capability.id} requires dependencies array`);
      }
      if (typeof capability.canRun !== 'function') {
        throw new Error(`Capability ${capability.id} requires canRun(ProjectContext)`);
      }
      if (typeof capability.execute !== 'function') {
        throw new Error(`Capability ${capability.id} requires execute(ProjectContext)`);
      }
      byId.set(capability.id, capability);
    },

    get(id) {
      return byId.get(id) || null;
    },

    list() {
      return [...byId.values()];
    },

    clear() {
      byId.clear();
    },

    size() {
      return byId.size;
    },

    /**
     * Next runnable capability: manifest/order → deps satisfied → canRun.
     */
    discoverNext(context, options = {}) {
      return discoverNextCapability([...byId.values()], context, options.orderIds);
    },
  };
}

/** Dependency satisfied when an output of that kind exists on ProjectContext. */
export function dependenciesSatisfied(capability, context) {
  const outputs = Array.isArray(context?.outputs) ? context.outputs : [];
  return (capability.dependencies || []).every((depId) =>
    outputs.some((item) => item.kind === depId),
  );
}

/**
 * Discover the next capability to dispatch.
 * @param {object[]} capabilities
 * @param {object} context ProjectContext
 * @param {string[]} [orderIds] preferred order (from manifest); unlisted caps sort after
 */
export function discoverNextCapability(capabilities, context, orderIds) {
  if (!context || typeof context !== 'object') return null;

  const status = context.pipelineStatus;
  if (status === 'CANCELLED' || status === 'FAILED') return null;

  const orderIndex = new Map((orderIds || []).map((id, index) => [id, index]));
  const ordered = [...capabilities].sort((a, b) => {
    const ai = orderIndex.has(a.id) ? orderIndex.get(a.id) : Number.MAX_SAFE_INTEGER;
    const bi = orderIndex.has(b.id) ? orderIndex.get(b.id) : Number.MAX_SAFE_INTEGER;
    if (ai !== bi) return ai - bi;
    return String(a.id).localeCompare(String(b.id));
  });

  for (const capability of ordered) {
    if (!dependenciesSatisfied(capability, context)) continue;
    if (!capability.canRun(context)) continue;
    return capability;
  }

  return null;
}

/** Default singleton used by the platform (tests may createCapabilityRegistry()). */
export const defaultCapabilityRegistry = createCapabilityRegistry();
