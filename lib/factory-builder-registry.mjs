/**
 * Builder Registry — production builders only (separate from Capability Registry).
 * ProductionController dispatches builders; builders never call each other.
 */

export function createBuilderRegistry() {
  /** @type {Map<string, object>} */
  const byId = new Map();
  /** @type {Map<string, object>} */
  const byWorkOrderType = new Map();

  return {
    register(builder) {
      if (!builder?.id || typeof builder.id !== 'string') {
        throw new Error('Builder requires a string id');
      }
      if (!builder.workOrderType || typeof builder.workOrderType !== 'string') {
        throw new Error(`Builder ${builder.id} requires workOrderType`);
      }
      if (typeof builder.canBuild !== 'function' || typeof builder.build !== 'function') {
        throw new Error(`Builder ${builder.id} requires canBuild and build`);
      }
      byId.set(builder.id, builder);
      byWorkOrderType.set(builder.workOrderType, builder);
    },

    get(id) {
      return byId.get(id) || null;
    },

    getByWorkOrderType(type) {
      return byWorkOrderType.get(type) || null;
    },

    list() {
      return [...byId.values()];
    },

    supportedWorkOrderTypes() {
      return [...byWorkOrderType.keys()];
    },

    clear() {
      byId.clear();
      byWorkOrderType.clear();
    },

    size() {
      return byId.size;
    },
  };
}

export const defaultBuilderRegistry = createBuilderRegistry();
