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
  if (previous && previous.email !== email) throw Error('Lead identity mismatch');
  return writeBrickRecord(tenant, id, {
    ...tenant, submissionId, email, delivery, portalAccess,
    updatedAt: new Date().toISOString()
  });
}
