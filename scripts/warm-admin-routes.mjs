const baseUrl = process.env.WARM_BASE_URL ?? 'http://localhost:3000';

const routes = [
  '/admin/master',
  '/admin/ea-factory',
  '/admin/ea-factory/skin-factory',
  '/admin/ea-factory/skin-factory/new',
  '/admin/ea-factory/skin-factory/briefs',
  '/admin/ea-factory/launches',
  '/admin/ea-factory/repo-library',
  '/admin/ea-factory/project-generator',
  '/admin/protocol-center',
  '/admin/foundation-library',
];

async function warmRoute(route) {
  const started = performance.now();
  const signal = AbortSignal.timeout(20000);
  const response = await fetch(`${baseUrl}${route}`, {
    headers: { 'x-admin-route-warmup': '1' },
    signal,
  });
  const elapsed = Math.round(performance.now() - started);
  console.log(`${response.status} ${route} ${elapsed}ms`);
}

console.log(`Warming admin routes at ${baseUrl}`);

for (const route of routes) {
  try {
    await warmRoute(route);
  } catch (error) {
    console.error(`ERR ${route}`, error instanceof Error ? error.message : String(error));
  }
}

console.log('Admin route warm-up complete.');
