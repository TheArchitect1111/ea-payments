import { listStudioRecords, saveStudioRecord } from '@/lib/creative-studio/persistence';
import { AmandaChangeArea, AmandaChangeClass, classifyAmandaChange } from './update-governance';

export type AmandaUpdateStatus = 'submitted' | 'confirmation-required' | 'pricing-required' | 'approved' | 'executing' | 'verified' | 'declined';
export type AmandaUpdateRequest = {
  id: string;
  source: 'update-hub' | 'eva';
  area: AmandaChangeArea;
  classification: AmandaChangeClass;
  request: string;
  status: AmandaUpdateStatus;
  createdAt: string;
  updatedAt: string;
};

const ORGANIZATION_ID = 'amanda-catherine';

export async function createAmandaUpdateRequest(input: { source?: 'update-hub' | 'eva'; area: AmandaChangeArea; request: string }) {
  const classification = classifyAmandaChange(input.area);
  const now = new Date().toISOString();
  const id = `update-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  const status: AmandaUpdateStatus = classification === 'standard' ? 'submitted' : classification === 'review' ? 'confirmation-required' : 'pricing-required';
  const record: AmandaUpdateRequest = { id, source: input.source ?? 'update-hub', area: input.area, classification, request: input.request.trim(), status, createdAt: now, updatedAt: now };
  const saved = await saveStudioRecord({ recordType: 'experience', id: `amanda-update-${id}`, organizationId: ORGANIZATION_ID, title: `Amanda update: ${input.area}`, payload: record });
  return { record, durable: saved.persistedToAirtable, ok: saved.ok };
}

export async function listAmandaUpdateRequests(): Promise<AmandaUpdateRequest[]> {
  const records = await listStudioRecords<AmandaUpdateRequest>('experience', ORGANIZATION_ID);
  return records.filter((record) => record?.id?.startsWith('update-')).sort((a,b) => b.createdAt.localeCompare(a.createdAt));
}
