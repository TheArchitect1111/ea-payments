import type { NextConfig } from 'next';

import vercelJson from './vercel.json';

const nextConfig: NextConfig = {
  transpilePackages: ['@ea/portal-chassis'],
  async redirects() {
    return (vercelJson.redirects ?? []).map((rule) => ({
      source: rule.source,
      destination: rule.destination,
      permanent: rule.permanent ?? false,
    }));
  },
};

export default nextConfig;
