const originalFetch = globalThis.fetch;
globalThis.fetch = (target, init) => {
  const url = new URL(typeof target === 'string' || target instanceof URL ? target : target.url);
  if (!['localhost','127.0.0.1','[::1]'].includes(url.hostname))
    return Promise.reject(new Error('Offline acceptance suite forbids external provider access'));
  return originalFetch(target, init);
};
