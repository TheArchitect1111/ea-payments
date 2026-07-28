/**
 * Trust Engine notification hooks — reuse dispatchNotification / Pulse.
 */
import { dispatchNotification } from '@/lib/notify-dispatch';
import type { TrustLegalDocType } from './types';

export type LegalNotifyKind =
  | 'version_published'
  | 'msa_waiting'
  | 'sow_waiting'
  | 'reacceptance_required'
  | 'support_updated';

export type LegalNotifyInput = {
  kind: LegalNotifyKind;
  docType?: TrustLegalDocType;
  version?: string;
  clientId?: string;
  organizationId?: string;
  clientsAffected?: number;
  email?: string;
};

function pulseFor(input: LegalNotifyInput) {
  const tenantId = input.organizationId ?? input.clientId;
  switch (input.kind) {
    case 'version_published':
      return {
        product: 'ea-platform' as const,
        type: 'trust.legal.version_published' as const,
        title: `Legal update: ${input.docType ?? 'document'} v${input.version ?? ''}`,
        detail: `${input.clientsAffected ?? 0} clients may need reacceptance`,
        priority: 'high' as const,
        href: '/admin/legal',
        tenantId,
        metadata: {
          docType: input.docType ?? '',
          version: input.version ?? '',
        },
      };
    case 'msa_waiting':
      return {
        product: 'ea-platform' as const,
        type: 'trust.msa.sent' as const,
        title: 'MSA awaiting signature',
        detail: input.clientId ? `Client ${input.clientId}` : undefined,
        priority: 'high' as const,
        href: '/admin/legal',
        tenantId,
      };
    case 'sow_waiting':
      return {
        product: 'ea-platform' as const,
        type: 'trust.sow.generated' as const,
        title: 'SOW awaiting signature',
        detail: input.clientId ? `Client ${input.clientId}` : undefined,
        priority: 'high' as const,
        href: '/admin/legal',
        tenantId,
      };
    case 'reacceptance_required':
      return {
        product: 'ea-platform' as const,
        type: 'trust.legal.reacceptance_required' as const,
        title: 'Documents require acceptance',
        detail: input.docType
          ? `${input.docType} v${input.version ?? ''}`.trim()
          : 'Updated legal documents',
        priority: 'high' as const,
        href: '/legal/privacy',
        tenantId,
      };
    case 'support_updated':
      return {
        product: 'ea-platform' as const,
        type: 'trust.support.updated' as const,
        title: 'Support Policy updated',
        detail: input.version ? `Version ${input.version}` : undefined,
        priority: 'medium' as const,
        href: '/legal/support',
        tenantId,
      };
    default:
      return null;
  }
}

/** Fire Pulse (+ optional email) for legal governance events. */
export async function notifyLegalEvent(input: LegalNotifyInput): Promise<void> {
  const pulse = pulseFor(input);
  if (!pulse) return;

  const payload: Parameters<typeof dispatchNotification>[0] = { pulse };

  if (input.email && input.kind === 'reacceptance_required') {
    payload.email = {
      to: input.email,
      subject: 'A few documents need a quiet look',
      html: `<p>When you’re ready, review and continue — no rush.</p><p><a href="https://efficiencyarchitects.online/legal/privacy">Open Trust &amp; Legal</a></p>`,
    };
  }

  await dispatchNotification(payload);
}

export async function notifyDocumentsRequiringAcceptance(input: {
  email: string;
  organizationId: string;
  clientId?: string;
  docTypes: TrustLegalDocType[];
}) {
  await notifyLegalEvent({
    kind: 'reacceptance_required',
    organizationId: input.organizationId,
    clientId: input.clientId,
    email: input.email,
    docType: input.docTypes[0],
  });
}
