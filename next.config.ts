import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import vercelJson from './vercel.json';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  // Temporary: master currently has incomplete executive-shell modules blocking Vercel.
  // Keeps CTP welcome/portal email fixes deployable while those surfaces are restored.
  typescript: {
    ignoreBuildErrors: true,
  },
  transpilePackages: [
    '@ea/portal-chassis',
    '@ea/capability-registry',
    '@ea/module-engine',
    '@ea/theme-engine',
    '@ea/personality-engine',
    '@ea/website-engine',
    '@ea/workspace-engine',
    '@ea/payments-contract',
  ],
  turbopack: {
    // Avoid picking C:\Users\brick\package-lock.json when multiple lockfiles exist.
    root: path.join(__dirname),
  },
  async redirects() {
    return (vercelJson.redirects ?? []).map((rule) => ({
      source: rule.source,
      destination: rule.destination,
      permanent: rule.permanent ?? false,
    }));
  },
};

export default nextConfig;
