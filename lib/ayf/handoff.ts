import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from '@/lib/bricks/durable';

type Delivery = 'pending' | 'sent' | 'failed';
type Handoff = BrickTenant & {
  submissionId: string;
  email: string;
  delivery: Delivery;
  portalAccess: 'pending' | 'verified';
  updatedAt: string;
};

const key = (tenant: BrickTenant, id: string) =>
  'ayf-handoff-' + brickHash([tenant.organizationId, id]);

export async function saveAyfHandoff(
  tenant: BrickTenant,
  submissionId: string,
  email: string,
  delivery: Delivery = 'pending',
  portalAccess: Handoff['portalAccess'] = 'pending'
) {
  if (tenant.portalSlug !== 'are-you-fundable') throw Error('AYF tenant required');
  const id = key(tenant, submissionId);
  const previous = await readBrickRecord<Handoff>(tenant, id);
  if (previous) {
    if (previous.email.trim().toLowerCase() !== email.trim().toLowerCase())
      throw Error('Lead identity mismatch');
    return previous;
  }
  return writeBrickRecord(tenant, id, {
    ...tenant, submissionId, email, delivery, portalAccess,
    updatedAt: new Date().toISOString()
  });
}

export async function readAyfClientHandoff(
  tenant: BrickTenant,
  submissionId: string,
  session: { orgId?: string; slug?: string; email?: string }
) {
  if (
    tenant.portalSlug !== 'are-you-fundable' ||
    session.orgId !== tenant.organizationId ||
    session.slug !== tenant.portalSlug ||
    !session.email
  ) throw Error('Portal access denied');

  const row = await readBrickRecord<Handoff>(tenant, key(tenant, submissionId));

  if (
    !row ||
    row.email.trim().toLowerCase() !== session.email.trim().toLowerCase()
  ) throw Error('Portal access denied');

  return row;
}

export async function markAyfEmailResult(
  tenant: BrickTenant,
  submissionId: string,
  accepted: boolean
) {
  if (tenant.portalSlug !== 'are-you-fundable')
    throw Error('AYF tenant required');

  const id = key(tenant, submissionId);
  const previous = await readBrickRecord<Handoff>(tenant, id);
  if (!previous) throw Error('AYF handoff missing');

  return writeBrickRecord(tenant, id, {
    ...previous,
    delivery: accepted ? 'sent' : 'failed',
    updatedAt: new Date().toISOString()
  });
}
