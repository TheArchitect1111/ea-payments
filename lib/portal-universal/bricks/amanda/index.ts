import { createHash } from 'node:crypto';
import { z } from 'zod';
import { loadStudioRecordFromAirtable, saveStudioRecord } from '@/lib/creative-studio/persistence';

export const AMANDA_BRICK_MODULES = ['member', 'training', 'billing', 'intake', 'applications', 'reports', 'messaging', 'settings'] as const;
export const AmandaInstallSchema = z.object({
  brandName: z.string().trim().min(1).max(120),
  confirmationSubject: z.string().trim().min(1).max(200),
  confirmationHtml: z.string().min(1).max(20000),
  offers: z.array(z.object({
    id: z.string().regex(/^[a-z0-9-]{1,80}$/),
    title: z.string().trim().min(1).max(200),
    amount: z.number().int().positive(),
    currency: z.string().regex(/^[a-z]{3}$/),
  }).strict()).min(1).max(100),
}).strict().superRefine((config, ctx) => {
  if (new Set(config.offers.map(x => x.id)).size !== config.offers.length)
    ctx.addIssue({ code: 'custom', message: 'Offer IDs must be unique' });
});
export type AmandaInstallConfig = z.infer<typeof AmandaInstallSchema>;
export type BrickTenant = { organizationId: string; portalSlug: string };
export type Registration = BrickTenant & {
  registration_id: string; email: string; name: string; offerId: string;
  payment_status: 'unpaid' | 'paid'; payment_reference: string | null;
  confirmationSent?: boolean;
};
const hash = (value: string) => createHash('sha256').update(value).digest('hex');
export function assertBrickTenant(tenant: BrickTenant) {
  if (!/^rec[a-zA-Z0-9]+$/.test(tenant.organizationId) || !/^[a-z0-9-]+$/.test(tenant.portalSlug))
    throw new Error('Persisted tenant identity required');
}
function installId(tenant: BrickTenant) { assertBrickTenant(tenant); return 'amanda-install-' + hash(tenant.organizationId); }
async function durable(tenant: BrickTenant, id: string, payload: unknown) {
  const saved = await saveStudioRecord({ recordType: 'experience', id,
    organizationId: tenant.organizationId, title: 'Enrollment service', payload });
  if (!saved.ok || !saved.persistedToAirtable) throw new Error('Enrollment durable write failed');
}
export async function installAmandaBrick(tenant: BrickTenant, input: unknown) {
  const config = AmandaInstallSchema.parse(input);
  await durable(tenant, installId(tenant), { ...tenant, brickId: 'amanda', version: 1, config });
  return loadAmandaInstall(tenant);
}
export async function loadAmandaInstall(tenant: BrickTenant) {
  const row = await loadStudioRecordFromAirtable<BrickTenant & { config: AmandaInstallConfig }>('experience', installId(tenant));
  if (!row || row.organizationId !== tenant.organizationId || row.portalSlug !== tenant.portalSlug)
    throw new Error('Enrollment service is not installed for this tenant');
  return AmandaInstallSchema.parse(row.config);
}
export async function readAmandaRegistration(tenant: BrickTenant, id: string) {
  assertBrickTenant(tenant);
  if (!/^[a-f0-9]{64}$/.test(id)) throw new Error('Invalid registration');
  const row = await loadStudioRecordFromAirtable<Registration>('experience', 'enrollment-' + id);
  if (!row || row.organizationId !== tenant.organizationId || row.portalSlug !== tenant.portalSlug)
    throw new Error('Matching tenant registration not found');
  return row;
}
export async function signupAmandaBrick(tenant: BrickTenant, input: unknown) {
  const config = await loadAmandaInstall(tenant);
  const data = z.object({ email: z.string().email().transform(s => s.trim().toLowerCase()),
    name: z.string().trim().min(1).max(200), offerId: z.string() }).strict().parse(input);
  if (!config.offers.some(x => x.id === data.offerId)) throw new Error('Unknown offer');
  const id = hash(JSON.stringify([tenant.organizationId, data.email, data.offerId]));
  const previous = await loadStudioRecordFromAirtable<Registration>('experience', 'enrollment-' + id);
  if (previous && (previous.organizationId !== tenant.organizationId || previous.portalSlug !== tenant.portalSlug))
    throw new Error('Registration tenant mismatch');
  const row: Registration = previous ?? { ...tenant, ...data, registration_id: id, payment_status: 'unpaid', payment_reference: null };
  await durable(tenant, 'enrollment-' + id, row);
  await durable(tenant, 'enrollment-signup-' + id, { ...row, event_type: 'signup' });
  return readAmandaRegistration(tenant, id);
}
export type VerifiedPayment = { reference: string; organizationId: string; registrationId: string;
  offerId: string; amount: number; currency: string; paid: boolean };
export async function payAmandaBrick(tenant: BrickTenant, id: string, reference: string, ports: {
  verify: (reference: string) => Promise<VerifiedPayment>;
  confirm: (message: { to: string; subject: string; html: string }) => Promise<void>;
}) {
  const config = await loadAmandaInstall(tenant);
  const row = await readAmandaRegistration(tenant, id);
  const offer = config.offers.find(x => x.id === row.offerId);
  const payment = await ports.verify(reference);
  if (!offer || !payment.paid || payment.reference !== reference || payment.organizationId !== tenant.organizationId ||
      payment.registrationId !== id || payment.offerId !== row.offerId || payment.amount !== offer.amount || payment.currency !== offer.currency)
    throw new Error('Verified matching payment required');
  if (row.payment_reference && row.payment_reference !== reference) throw new Error('Conflicting payment');
  const next = { ...row, payment_status: 'paid' as const, payment_reference: reference };
  await durable(tenant, 'enrollment-' + id, next);
  await durable(tenant, 'enrollment-payment-' + id, { ...next, event_type: 'payment_confirmed' });
  if (!next.confirmationSent) {
    const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    await ports.confirm({ to: row.email,
      subject: config.confirmationSubject.replace(/{{class_name}}/g, offer.title),
      html: config.confirmationHtml.replace(/{{first_name}}/g, escape(row.name.split(/\s+/)[0]))
        .replace(/{{class_name}}/g, escape(offer.title)) });
    await durable(tenant, 'enrollment-' + id, { ...next, confirmationSent: true });
  }
  return readAmandaRegistration(tenant, id);
}
