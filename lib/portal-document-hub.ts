/**
 * Tenant document hub — CTP vault + Update Hub files + training (not static stubs only).
 */
import type { PortalClientRecord } from '@/lib/airtable';
import { getContentRequestsForClient } from '@/lib/airtable';
import { buildCtpDocumentsView } from '@/lib/ctp-documents-view';
import { getCtpSubmissionForPortal } from '@/lib/ctp-submissions';
import {
  findPublishedSitePage,
  siteUrlForSlug,
} from '@/lib/provision-website-portal';
import { listPublishedTrainingForTenant } from '@/lib/training-transformation-store';

export type PortalDocumentItem = {
  title: string;
  href: string;
  note: string;
  source: 'package' | 'site' | 'ctp' | 'training' | 'request' | 'hub';
  external?: boolean;
};

export async function listPortalDocuments(
  slug: string,
  client: PortalClientRecord,
): Promise<PortalDocumentItem[]> {
  const items: PortalDocumentItem[] = [];
  let hasTenantVault = false;

  try {
    const submission = await getCtpSubmissionForPortal({
      portalSlug: slug,
      email: client.email,
    });
    if (submission) {
      const view = buildCtpDocumentsView(submission, slug);
      for (const upload of view.uploads) {
        hasTenantVault = true;
        items.push({
          title: upload.fileName || upload.label,
          href: upload.url,
          note: `CTP upload · ${upload.label}`,
          source: 'ctp',
          external: /^https?:\/\//i.test(upload.url),
        });
      }
      for (const deliverable of view.deliverables.filter((d) => d.ready)) {
        hasTenantVault = true;
        items.push({
          title: deliverable.title,
          href: deliverable.href,
          note: deliverable.detail,
          source: 'ctp',
          external: Boolean(deliverable.external) || /^https?:\/\//i.test(deliverable.href),
        });
      }
      items.push({
        title: 'CTP document vault',
        href: `/portal/${slug}/ctp/documents`,
        note: `${view.readyCount} ready · upload brand assets and open deliverables`,
        source: 'ctp',
      });
    }
  } catch {
    // CTP vault is best-effort.
  }

  try {
    const site = await findPublishedSitePage(slug);
    if (site) {
      items.push({
        title: 'Public website',
        href: siteUrlForSlug(slug),
        note: 'Live starter or published site for this portal.',
        source: 'site',
      });
    }
  } catch {
    // Site lookup is best-effort.
  }

  items.push(
    {
      title: 'Update Hub',
      href: `/portal/${slug}/updates`,
      note: 'Published updates and content requests.',
      source: 'hub',
    },
    {
      title: 'Training Hub',
      href: `/portal/${slug}/learning`,
      note: 'Assigned training and learning paths.',
      source: 'training',
    },
  );

  try {
    const training = await listPublishedTrainingForTenant(slug);
    for (const record of training.slice(0, 8)) {
      items.push({
        title: record.title,
        href: `/portal/${slug}/learning`,
        note: record.understanding.summary || 'Published training for this tenant.',
        source: 'training',
      });
    }
  } catch {
    // non-fatal
  }

  if (client.id) {
    try {
      const requests = await getContentRequestsForClient(client.id);
      for (const req of requests) {
        if (req.documentUrl) {
          hasTenantVault = true;
          items.push({
            title: req.title || 'Shared document',
            href: req.documentUrl,
            note: `From Update Hub request · ${req.status}`,
            source: 'request',
            external: /^https?:\/\//i.test(req.documentUrl),
          });
        }
      }
    } catch {
      // non-fatal
    }
  }

  // Global EA funnels only when this tenant has no real vault yet.
  if (!hasTenantVault) {
    items.unshift(
      {
        title: 'Visibility Assessment Scorecard',
        href: '/scorecard',
        note: 'Lead magnet scorecard for capacity conversations.',
        source: 'package',
      },
      {
        title: 'Operational MRI™',
        href: '/assessment',
        note: 'Capacity assessment funnel.',
        source: 'package',
      },
    );
  }

  if (client.packagePurchased) {
    items.push({
      title: `Package: ${client.packagePurchased}`,
      href: `/portal/${slug}`,
      note: `Paid ${client.paymentDate ?? '—'} · Portal ${client.portalAccessStatus ?? 'Pending'}`,
      source: 'package',
    });
  }

  return items;
}
