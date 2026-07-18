/**
 * Downloadable Factory package — founder-facing brief (not raw JSON).
 */
import {
  buildFactoryClientPackage,
  exportFactoryClientPackageMarkdown,
} from '@/lib/factory-client-package';
import type { FactoryProject } from '@/lib/factory-project-store';
import { EA_PLATFORM_URL } from '@/lib/platform-urls';

export function factoryPackageDownloadUrl(projectId: string): string {
  const base = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    EA_PLATFORM_URL ||
    'https://efficiencyarchitects.online'
  )
    .replace(/\/$/, '')
    .replace(/^https?:\/\/www\.efficiencyarchitects\.online/i, 'https://efficiencyarchitects.online');
  return `${base}/api/projects/${encodeURIComponent(projectId)}/export`;
}

export function exportFactoryProjectMarkdown(project: FactoryProject): string {
  return exportFactoryClientPackageMarkdown(buildFactoryClientPackage(project));
}

export function exportFactoryProjectJson(project: FactoryProject): string {
  return JSON.stringify(
    {
      exportedAt: new Date().toISOString(),
      package: buildFactoryClientPackage(project),
      // Debug payload kept under a clear key — not the primary email package.
      debug: {
        projectId: project.id,
        pipelineStatus: project.pipelineStatus,
        artifactCount: project.context?.artifacts?.length ?? 0,
        outputCount: project.context?.outputs?.length ?? 0,
      },
    },
    null,
    2,
  );
}
