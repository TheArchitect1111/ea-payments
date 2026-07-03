import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import vercelJson from './vercel.json';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  transpilePackages: ['@ea/portal-chassis'],
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
