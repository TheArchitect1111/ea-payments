/**
 * Tenant document hub — real links for the portal documents module.
 */
import type { PortalClientRecord } from '@/lib/airtable';
import { getContentRequestsForClient } from '@/lib/airtable';
import {
  findPublishedSitePage,
  siteUrlForSlug,
} from '@/lib/provision-website-portal';
import { listPublishedTrainingForTenant } from '@/lib/training-transformation-store';
import { listOsCapabilitiesByModule } from '@/lib/os-capability-taxonomy';

export type PortalDocumentItem = {
  title: string;
  href: string;
  note: string;
  source: 'package' | 'site' | 'ctp' | 'training' | 'request' | 'hub';
};

export async function listPortalDocuments(
  slug: string,
  client: PortalClientRecord,
): Promise<PortalDocumentItem[]> {
  void listOsCapabilitiesByModule('documents');

  const items: PortalDocumentItem[] = [
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
  ];

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
      title: 'Client Experience / CTP',
      href: `/portal/${slug}/ctp`,
      note: 'Opportunity workspace and deliverables.',
      source: 'ctp',
    },
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
          items.push({
            title: req.title || 'Shared document',
            href: req.documentUrl,
            note: `From Update Hub request · ${req.status}`,
            source: 'request',
          });
        }
      }
    } catch {
      // non-fatal
    }
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
