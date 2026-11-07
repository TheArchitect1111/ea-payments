import { z } from 'zod';
import { findMembership } from '@/lib/memberships';
import { brickHash, readBrickRecord, writeBrickRecord, type BrickTenant } from '@/lib/bricks/durable';

export const CustomerEmail = z.string().trim().email().max(254).transform(value => value.toLowerCase());
export type CustomerActor = { slug?: string; orgId?: string; email?: string };
export type CustomerOwnership = { customerEmail?: string; customerMembershipId?: string };
type Assignment = BrickTenant & { customerEmail: string; customerMembershipId: string; staffEmails: string[]; staffMembershipIds: string[]; updatedBy: string; updatedAt: string };
const assignmentId = (tenant: BrickTenant, email: string) => 'ayf-customer-access-' + brickHash([tenant.organizationId, email]);
export const isAyf = (tenant: BrickTenant) => tenant.portalSlug === 'are-you-fundable';

export async function customerPrincipal(tenant: BrickTenant, actor?: CustomerActor) {
  if (!actor || actor.slug !== tenant.portalSlug || actor.orgId !== tenant.organizationId || !/^rec[A-Za-z0-9]+$/.test(tenant.organizationId))
    throw Error('Customer access denied');
  const email = CustomerEmail.parse(actor.email);
  const membership = await findMembership(email, tenant.organizationId);
  if (!membership || !/^rec[A-Za-z0-9]+$/.test(membership.id) || membership.organizationId !== tenant.organizationId || membership.userEmail.toLowerCase() !== email || membership.status !== 'active')
    throw Error('Customer access denied');
  return { email, id: membership.id, role: membership.role, admin: membership.role === 'admin' || membership.role === 'owner',
    staff: ['staff', 'manager', 'admin', 'owner'].includes(membership.role) };
}

export async function bindCustomerOwnership(tenant: BrickTenant, customerEmail?: string) {
  const email = CustomerEmail.parse(customerEmail);
  const customer = await findMembership(email, tenant.organizationId);
  if (!customer || !/^rec[A-Za-z0-9]+$/.test(customer.id) || customer.organizationId !== tenant.organizationId || customer.userEmail.toLowerCase() !== email || customer.status !== 'active' || !['viewer','guest'].includes(customer.role))
    throw Error('Active customer membership required');
  return { customerEmail: email, customerMembershipId: customer.id };
}

export async function customerRecordAllowed(tenant: BrickTenant, ownership: CustomerOwnership,
  visibility: string, actor?: CustomerActor, staffOnly = false): Promise<boolean> {
  if (!isAyf(tenant)) return true;
  const principal = await customerPrincipal(tenant, actor);
  if (principal.admin) return true;
  const owner = CustomerEmail.safeParse(ownership.customerEmail);
  if (!owner.success || !ownership.customerMembershipId) return false; // Legacy/unowned records are administrator-only.
  const customer = await findMembership(owner.data, tenant.organizationId);
  if (!customer || customer.status !== 'active' || customer.id !== ownership.customerMembershipId) return false;
  if (principal.staff) {
    const assignment = await readBrickRecord<Assignment>(tenant, assignmentId(tenant, owner.data));
    return assignment?.customerEmail === owner.data && assignment.customerMembershipId === ownership.customerMembershipId && assignment.staffMembershipIds.includes(principal.id) || false;
  }
  return !staffOnly && visibility === 'member' && principal.email === owner.data && principal.id === ownership.customerMembershipId;
}

export async function assertCustomerRecord(tenant: BrickTenant, ownership: CustomerOwnership,
  visibility: string, actor?: CustomerActor, staffOnly = false) {
  if (!await customerRecordAllowed(tenant, ownership, visibility, actor, staffOnly)) throw Error('Customer access denied');
}

export async function setCustomerStaff(tenant: BrickTenant, actor: CustomerActor, input: unknown) {
  if (!isAyf(tenant)) throw Error('AYF tenant required');
  const principal = await customerPrincipal(tenant, actor);
  if (!principal.admin) throw Error('Administrator required');
  const parsed = z.object({ customerEmail: CustomerEmail, staffEmails: z.array(CustomerEmail).max(50) }).strict().parse(input);
  const ownership = await bindCustomerOwnership(tenant, parsed.customerEmail);
  const staffEmails = [...new Set(parsed.staffEmails)].sort();
  const staffMembershipIds: string[] = [];
  for (const email of staffEmails) {
    const staff = await findMembership(email, tenant.organizationId);
    if (!staff || !/^rec[A-Za-z0-9]+$/.test(staff.id) || staff.organizationId !== tenant.organizationId || staff.userEmail.toLowerCase() !== email || staff.status !== 'active' || !['staff', 'manager', 'admin', 'owner'].includes(staff.role)) throw Error('Active staff membership required');
    staffMembershipIds.push(staff.id);
  }
  return writeBrickRecord<Assignment>(tenant, assignmentId(tenant, parsed.customerEmail), { ...tenant, ...parsed, ...ownership,
    staffEmails, staffMembershipIds, updatedBy: principal.email, updatedAt: new Date().toISOString() });
}
