/**
 * Small in-process TTL cache for read-only results.
 * Concurrent misses for the same key share one loader; invalidation prevents an old
 * in-flight read from repopulating the cache after a write.
 */
export function createTtlReadCache(ttlMs = 60_000, now = () => Date.now()) {
  const values = new Map();
  const inFlight = new Map();
  const generations = new Map();

  return {
    async get(key, loader) {
      const cached = values.get(key);
      if (cached && cached.expiresAt > now()) return structuredClone(cached.value);

      const pending = inFlight.get(key);
      if (pending) return structuredClone(await pending);

      const generation = generations.get(key) ?? 0;
      const request = Promise.resolve()
        .then(loader)
        .then((value) => {
          if ((generations.get(key) ?? 0) === generation) {
            values.set(key, { expiresAt: now() + ttlMs, value: structuredClone(value) });
          }
          return value;
        })
        .finally(() => {
          if (inFlight.get(key) === request) inFlight.delete(key);
        });

      inFlight.set(key, request);
      return structuredClone(await request);
    },
    invalidate(key) {
      values.delete(key);
      generations.set(key, (generations.get(key) ?? 0) + 1);
      inFlight.delete(key);
    },
  };
}
