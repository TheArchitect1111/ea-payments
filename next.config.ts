import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import vercelJson from './vercel.json';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  /**
   * Prevent accidental serverless inclusion of mobile binaries, marketing
   * screenshots, docs, and other non-runtime trees. Bare process.cwd() fs
   * helpers historically caused NFT to attach ~500MB to admin routes.
   */
  outputFileTracingIncludes: {
    '/app/api/admin/video-factory/publish/**': ['./public/video-factory/**'],
    './app/api/admin/video-factory/publish/**': ['./public/video-factory/**'],
  },
  outputFileTracingExcludes: {
    '*': [
      './mobile/**',
      './marketing/**',
      './docs/**',
      './scripts/**',
      './services/**',
      './prototypes/**',
      './extension/**',
      './supabase/**',
      './tests/**',
      './test-results/**',
      './playwright-report/**',
      './playwright*.ts',
      './.cursor/**',
      './.data/**',
      './.git/**',
      './public/client-experience/**',
      './public/ea-athletics-experience/**',
      './public/images/**',
      './public/brand/**',
      './video-factory/**',
      '**/node_modules/remotion/**',
      '**/node_modules/@remotion/**',
      '**/node_modules/playwright/**',
      '**/node_modules/playwright-core/**',
      '**/node_modules/@playwright/**',
      '**/node_modules/electron/**',
      '**/*.aab',
      '**/*.apk',
      '**/*.wasm',
      '**/*.sym',
    ],
  },
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
