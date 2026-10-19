import type { NextConfig } from 'next';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import vercelJson from './vercel.json';

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  experimental: { authInterrupts: true },
  outputFileTracingRoot: projectRoot,
  outputFileTracingIncludes: {
    '/api/portal/*/eva-help': ['./knowledge/*.json'],
    '/api/portal/*/eva-help/health': ['./knowledge/*.json'],
    './app/api/portal/[slug]/eva-help/**': ['./knowledge/*.json'],
    '/app/api/admin/video-factory/publish/**': ['./public/video-factory/**'],
    './app/api/admin/video-factory/publish/**': ['./public/video-factory/**'],
  },
  outputFileTracingExcludes: {
    '*': [
      './mobile/**','./marketing/**','./docs/**','./scripts/**','./services/**','./prototypes/**','./extension/**','./supabase/**','./tests/**','./test-results/**','./playwright-report/**','./playwright*.ts','./.cursor/**','./.data/**','./.git/**','./public/client-experience/**','./public/ea-athletics-experience/**','./public/images/**','./public/brand/**','./video-factory/**','**/node_modules/remotion/**','**/node_modules/@remotion/**','**/node_modules/playwright/**','**/node_modules/playwright-core/**','**/node_modules/@playwright/**','**/node_modules/electron/**','**/*.aab','**/*.apk','**/*.wasm','**/*.sym',
    ],
  },
  typescript: { ignoreBuildErrors: true },
  transpilePackages: ['@ea/portal-chassis','@ea/capability-registry','@ea/module-engine','@ea/theme-engine','@ea/personality-engine','@ea/website-engine','@ea/workspace-engine','@ea/payments-contract'],
  turbopack: { root: path.join(__dirname) },
  async rewrites() {
    const rawRewrites = (vercelJson as any).rewrites ?? [];
    const safeRewrites = Array.isArray(rawRewrites) ? rawRewrites : [];
    return {
      beforeFiles: safeRewrites
        .filter((rule: any) => rule?.source === '/hq/:path*' || rule?.has?.some((c: any) => c?.type === 'host'))
        .map((rule: any) => ({
          source: rule.source,
          destination: rule.source === '/' && rule.has?.some((c: any) => c?.type === 'host' && ['tb3.online','www.tb3.online'].includes(c?.value)) ? '/tarris' : rule.destination,
          has: rule.has,
        })),
      afterFiles: [],
      fallback: [],
    };
  },
  async headers() {
    const privateHeaders = [{ key: 'X-Robots-Tag', value: 'noindex, nofollow, noarchive, nosnippet' }];
    return [
      { source: '/tarris/future/:path*', headers: privateHeaders },
      { source: '/hq/:path*', headers: privateHeaders },
    ];
  },
  async redirects() {
    const rawRedirects = (vercelJson as any).redirects ?? [];
    return rawRedirects.map((rule: any) => ({
      source: rule.source,
      destination: rule.destination,
      permanent: rule.permanent ?? false,
    }));
  },
};

export default nextConfig;
