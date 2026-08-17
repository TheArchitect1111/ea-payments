import crypto from 'node:crypto';
import { listStudioRecords, loadStudioRecord, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { syntheticOrgId } from '@/lib/platform-store';

export type AmandaDeliveryKind = 'recording' | 'photo' | 'graphic' | 'document' | 'other';

export type AmandaDelivery = {
  id: string;
  portalSlug: string;
  recipientEmail: string;
  recipientName: string;
  title: string;
  kind: AmandaDeliveryKind;
  url: string;
  note?: string;
  status: 'delivered' | 'archived';
  deliveredAt: string;
  openedAt?: string;
  updatedAt: string;
};

function validUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === 'https:' || url.protocol === 'http:';
  } catch {
    return false;
  }
}
async function persist(item: AmandaDelivery) {
  const result = await saveStudioRecord({
    recordType: 'experience',
    id: item.id,
    organizationId: syntheticOrgId(item.portalSlug),
    title: `Amanda private delivery: ${item.title}`,
    payload: item,
  });
  if (!result.ok) throw new Error(result.error || 'Delivery could not be saved.');
  return item;
}

export async function createAmandaDelivery(input: {
  portalSlug: string;
  recipientEmail: string;
  recipientName: string;
  title: string;
  kind: AmandaDeliveryKind;
  url: string;
  note?: string;
}) {
  const email = input.recipientEmail.trim().toLowerCase();
  if (!email.includes('@')) throw new Error('A valid recipient email is required.');
  if (!input.title.trim()) throw new Error('A delivery title is required.');
  if (!validUrl(input.url.trim())) throw new Error('A valid http or https delivery link is required.');
  const now = new Date().toISOString();
  return persist({
    id: `amanda-delivery-${crypto.randomUUID()}`,
    portalSlug: input.portalSlug,
    recipientEmail: email,
    recipientName: input.recipientName.trim() || email,
    title: input.title.trim(),
    kind: input.kind,
    url: input.url.trim(),
    note: input.note?.trim() || undefined,
    status: 'delivered',
    deliveredAt: now,
    updatedAt: now,
  });
}

export async function listAmandaDeliveries(portalSlug: string, recipientEmail?: string) {
  const rows = await listStudioRecords<AmandaDelivery>('experience', syntheticOrgId(portalSlug));
  const email = recipientEmail?.trim().toLowerCase();
  return rows
    .filter((row) => row?.id?.startsWith('amanda-delivery-') && row.portalSlug === portalSlug)
    .filter((row) => !email || row.recipientEmail === email)
    .sort((a, b) => b.deliveredAt.localeCompare(a.deliveredAt));
}

export async function getAmandaDelivery(id: string) {
  return loadStudioRecord<AmandaDelivery>('experience', id);
}

export async function markAmandaDeliveryOpened(id: string) {
  const current = await getAmandaDelivery(id);
  if (!current) return null;
  const now = new Date().toISOString();
  return persist({ ...current, openedAt: current.openedAt || now, updatedAt: now });
}
