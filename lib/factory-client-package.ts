/**
 * Founder-facing Factory package (plain language) — not raw JSON dumps.
 */
import type { FactoryProject } from '@/lib/factory-project-store';
import { factoryFriendlyLabel } from '@/lib/factory-status-labels';

export type FactoryClientPackage = {
  clientName: string;
  projectId: string;
  statusLabel: string;
  goal: string;
  deliverable: string;
  sourceUrl?: string;
  summary: string;
  siteSnapshot: {
    title?: string;
    description?: string;
    imageUrl?: string;
  };
  imageUrls: string[];
  websitePages: Array<{ path: string; title: string; sections: string[] }>;
  deliverables: Array<{ title: string; summary: string; type: string }>;
  recommendations: string[];
  nextSteps: string[];
};

type ArtifactLike = {
  kind?: string;
  data?: Record<string, unknown>;
  providerId?: string;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim() ? value.trim() : undefined;
}

function collectImageUrls(project: FactoryProject, artifacts: ArtifactLike[]): string[] {
  const urls = new Set<string>();

  for (const attachment of project.attachments || []) {
    if (attachment.type === 'image' && attachment.url) urls.add(attachment.url);
  }

  for (const art of artifacts) {
    const data = art.data || {};
    const extracted = asRecord(data.extracted);
    const ogImage = str(extracted?.ogImage);
    if (ogImage) urls.add(ogImage);

    const brandingUrl = str(data.url) || str(data.imageUrl) || str(data.logoUrl);
    if (art.kind === 'branding' && brandingUrl?.match(/^https?:\/\//i)) {
      urls.add(brandingUrl);
    }
  }

  return [...urls].slice(0, 8);
}

function websitePagesFromArtifacts(artifacts: ArtifactLike[]): FactoryClientPackage['websitePages'] {
  const site = [...artifacts].reverse().find((a) => a.kind === 'website_site');
  const pages = (site?.data as { pages?: Array<Record<string, unknown>> } | undefined)?.pages;
  if (!Array.isArray(pages) || !pages.length) {
    const sitemap = [...artifacts].reverse().find((a) => a.kind === 'website_sitemap');
    const nodes = (sitemap?.data as { nodes?: Array<Record<string, unknown>> } | undefined)?.nodes;
    if (!Array.isArray(nodes)) return [];
    return nodes.map((node, index) => ({
      path: str(node.path) || `/${index + 1}`,
      title: str(node.title) || `Page ${index + 1}`,
      sections: ['Hero', 'Primary content'],
    }));
  }

  return pages.map((page, index) => {
    const sections = Array.isArray(page.sections)
      ? page.sections
          .map((section) => {
            const rec = asRecord(section);
            return str(rec?.label) || str(rec?.id) || '';
          })
          .filter(Boolean)
      : [];
    return {
      path: str(page.path) || `/${index + 1}`,
      title: str(page.title) || `Page ${index + 1}`,
      sections: sections.length ? sections : ['Hero', 'Primary content'],
    };
  });
}

function deliverablesFromArtifacts(artifacts: ArtifactLike[]): FactoryClientPackage['deliverables'] {
  return artifacts
    .filter((a) => a.kind === 'deliverable')
    .map((a) => {
      const deliverable = asRecord(a.data?.deliverable) || asRecord(a.data) || {};
      return {
        title: str(deliverable.title) || 'Deliverable',
        summary: str(deliverable.summary) || '',
        type: str(deliverable.type) || 'other',
      };
    });
}

function recommendationsFromArtifacts(artifacts: ArtifactLike[]): string[] {
  const recArt = [...artifacts].reverse().find((a) => a.kind === 'recommendations');
  const items = (recArt?.data as { items?: unknown[] } | undefined)?.items;
  if (Array.isArray(items)) {
    return items
      .map((item) => {
        if (typeof item === 'string') return item;
        const rec = asRecord(item);
        return str(rec?.title) || str(rec?.text) || str(rec?.summary) || '';
      })
      .filter(Boolean)
      .slice(0, 12);
  }

  const discovery = [...artifacts].reverse().find((a) => a.kind === 'organization_profile');
  const summary = str(asRecord(discovery?.data)?.summary);
  return summary ? [summary] : [];
}

export function buildFactoryClientPackage(project: FactoryProject): FactoryClientPackage {
  const artifacts = (project.context?.artifacts || []) as ArtifactLike[];
  const websiteArt = [...artifacts].reverse().find((a) => a.kind === 'website');
  const extracted = asRecord(asRecord(websiteArt?.data)?.extracted) || {};
  const imageUrls = collectImageUrls(project, artifacts);
  const pages = websitePagesFromArtifacts(artifacts);
  const deliverables = deliverablesFromArtifacts(artifacts);
  const recommendations = recommendationsFromArtifacts(artifacts);

  const siteTitle = str(extracted.title) || str(extracted.ogTitle) || project.client;
  const siteDescription = str(extracted.description);
  const siteImage = str(extracted.ogImage) || imageUrls[0];

  const summaryParts = [
    `EA Factory finished the automatic pass for ${project.client}.`,
    project.url ? `Source site: ${project.url}.` : '',
    siteDescription ? `What we read from the site: ${siteDescription}` : '',
    pages.length
      ? `Recommended website structure: ${pages.length} page(s) ready for review.`
      : 'Website structure is still thin — open the project to continue production.',
  ].filter(Boolean);

  return {
    clientName: project.client,
    projectId: project.id,
    statusLabel: factoryFriendlyLabel(project.pipelineStatus),
    goal: project.goal,
    deliverable: project.deliverable,
    sourceUrl: project.url,
    summary: summaryParts.join(' '),
    siteSnapshot: {
      title: siteTitle,
      description: siteDescription,
      imageUrl: siteImage,
    },
    imageUrls,
    websitePages: pages,
    deliverables,
    recommendations,
    nextSteps: [
      'Review the recommended website pages below.',
      'Reply to this email with changes you want before build/deploy.',
      'Approve content and navigation when you are ready for the next stage.',
    ],
  };
}

export function exportFactoryClientPackageMarkdown(pkg: FactoryClientPackage): string {
  const lines: string[] = [
    `# ${pkg.clientName} — Factory Package`,
    '',
    pkg.summary,
    '',
    `**Project:** ${pkg.projectId}`,
    `**Status:** ${pkg.statusLabel}`,
    `**Goal:** ${pkg.goal}`,
    `**Deliverable:** ${pkg.deliverable}`,
    pkg.sourceUrl ? `**Website:** ${pkg.sourceUrl}` : '',
    '',
    '## Site snapshot',
    '',
    pkg.siteSnapshot.title ? `**Title:** ${pkg.siteSnapshot.title}` : '',
    pkg.siteSnapshot.description ? `**Description:** ${pkg.siteSnapshot.description}` : '',
    '',
  ];

  if (pkg.imageUrls.length) {
    lines.push('## Images', '');
    for (const url of pkg.imageUrls) {
      lines.push(`![Image](${url})`);
      lines.push('');
      lines.push(url);
      lines.push('');
    }
  } else {
    lines.push('## Images', '', '_No images were captured for this run._', '');
  }

  lines.push('## Recommended website pages', '');
  if (!pkg.websitePages.length) {
    lines.push('_No page plan yet._', '');
  } else {
    for (const page of pkg.websitePages) {
      lines.push(`### ${page.title} (\`${page.path}\`)`);
      for (const section of page.sections) {
        lines.push(`- ${section}`);
      }
      lines.push('');
    }
  }

  lines.push('## Deliverables', '');
  if (!pkg.deliverables.length) {
    lines.push('_No production deliverables recorded yet._', '');
  } else {
    for (const item of pkg.deliverables) {
      lines.push(`- **${item.title}** (${item.type})${item.summary ? ` — ${item.summary}` : ''}`);
    }
    lines.push('');
  }

  if (pkg.recommendations.length) {
    lines.push('## Recommendations', '');
    for (const rec of pkg.recommendations) {
      lines.push(`- ${rec}`);
    }
    lines.push('');
  }

  lines.push('## Next steps', '');
  for (const step of pkg.nextSteps) {
    lines.push(`1. ${step}`);
  }
  lines.push('');

  return lines.filter((line, index, arr) => !(line === '' && arr[index - 1] === '')).join('\n');
}

export function renderFactoryClientPackageEmailHtml(
  pkg: FactoryClientPackage,
  escHtml: (s: string) => string,
): string {
  const images = pkg.imageUrls
    .map(
      (url) => `
      <div style="margin:0 0 16px;">
        <img src="${escHtml(url)}" alt="Captured image" width="560" style="max-width:100%;height:auto;display:block;border:0;" />
      </div>`,
    )
    .join('');

  const pages = pkg.websitePages.length
    ? pkg.websitePages
        .map((page) => {
          const sections = page.sections.map((s) => `<li>${escHtml(s)}</li>`).join('');
          return `<div style="margin:0 0 14px;padding:14px 16px;background:#F8F6F2;border-left:4px solid #C9A844;">
            <p style="margin:0 0 6px;font-size:15px;font-weight:700;color:#1B2B4D;">${escHtml(page.title)}</p>
            <p style="margin:0 0 8px;font-size:12px;color:#777;">${escHtml(page.path)}</p>
            <ul style="margin:0;padding-left:18px;color:#555;font-size:13px;line-height:1.6;">${sections}</ul>
          </div>`;
        })
        .join('')
    : `<p style="margin:0;font-size:14px;color:#777;">No page plan yet.</p>`;

  const deliverables = pkg.deliverables.length
    ? `<ul style="margin:0;padding-left:18px;color:#555;font-size:14px;line-height:1.7;">${pkg.deliverables
        .map(
          (d) =>
            `<li><strong>${escHtml(d.title)}</strong> (${escHtml(d.type)})${d.summary ? ` — ${escHtml(d.summary)}` : ''}</li>`,
        )
        .join('')}</ul>`
    : `<p style="margin:0;font-size:14px;color:#777;">No production deliverables recorded yet.</p>`;

  const recommendations = pkg.recommendations.length
    ? `<ul style="margin:0;padding-left:18px;color:#555;font-size:14px;line-height:1.7;">${pkg.recommendations
        .map((r) => `<li>${escHtml(r)}</li>`)
        .join('')}</ul>`
    : '';

  return `
    <p style="margin:0 0 16px;font-size:15px;color:#1A1A2E;line-height:1.7;">${escHtml(pkg.summary)}</p>
    <p style="margin:0 0 6px;font-size:13px;color:#777;">Project: ${escHtml(pkg.projectId)}</p>
    <p style="margin:0 0 18px;font-size:13px;color:#777;">Status: ${escHtml(pkg.statusLabel)} · Goal: ${escHtml(pkg.goal)}</p>

    <p style="margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Site snapshot</p>
    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#1B2B4D;">${escHtml(pkg.siteSnapshot.title || pkg.clientName)}</p>
    ${
      pkg.siteSnapshot.description
        ? `<p style="margin:0 0 16px;font-size:14px;color:#555;line-height:1.7;">${escHtml(pkg.siteSnapshot.description)}</p>`
        : ''
    }
    ${pkg.sourceUrl ? `<p style="margin:0 0 18px;font-size:13px;"><a href="${escHtml(pkg.sourceUrl)}" style="color:#1B2B4D;">${escHtml(pkg.sourceUrl)}</a></p>` : ''}

    ${
      images
        ? `<p style="margin:22px 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Images</p>${images}`
        : `<p style="margin:22px 0 18px;font-size:13px;color:#777;">No images were captured for this run.</p>`
    }

    <p style="margin:22px 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Recommended website pages</p>
    ${pages}

    <p style="margin:22px 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Deliverables</p>
    ${deliverables}

    ${
      recommendations
        ? `<p style="margin:22px 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Recommendations</p>${recommendations}`
        : ''
    }

    <p style="margin:22px 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#1B2B4D;">Next steps</p>
    <ol style="margin:0;padding-left:18px;color:#555;font-size:14px;line-height:1.7;">
      ${pkg.nextSteps.map((s) => `<li>${escHtml(s)}</li>`).join('')}
    </ol>
    <p style="margin:18px 0 0;font-size:12px;color:#888;line-height:1.6;">
      A readable .md copy of this same brief is attached. This is the Factory brief (structure + research), not a finished designed website zip.
    </p>
  `;
}
