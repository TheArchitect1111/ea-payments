import { airtableUpdate } from '@/lib/data/airtable-client';
import { create, rows, type Row } from '@/lib/amanda-catherine/registry';

export type AmandaMediaAsset = {
  id: string;
  title: string;
  url: string;
  thumbnail: string;
  type: 'image' | 'video';
  sort_order: number;
  is_visible: boolean;
  uploaded_at: string;
};

function toAsset(record: Row): AmandaMediaAsset {
  return {
    id: record.id,
    title: String(record.fields.title || ''),
    url: String(record.fields.url || ''),
    thumbnail: String(record.fields.thumbnail || ''),
    type: record.fields.type === 'video' ? 'video' : 'image',
    sort_order: Number(record.fields.sort_order || 0),
    is_visible: record.fields.is_visible === true,
    uploaded_at: String(record.fields.uploaded_at || ''),
  };
}

export async function listAmandaMediaAssets(includeHidden = false) {
  const items = await rows('media_assets', includeHidden ? 'TRUE()' : '{is_visible}=1');
  return items.map(toAsset).sort((a, b) => a.sort_order - b.sort_order || a.title.localeCompare(b.title));
}

export async function createAmandaMediaAsset(input: Omit<AmandaMediaAsset, 'id' | 'uploaded_at'>) {
  const created = await create('media_assets', {
    title: input.title,
    url: input.url,
    thumbnail: input.thumbnail || undefined,
    type: input.type,
    sort_order: input.sort_order,
    is_visible: input.is_visible,
    uploaded_at: new Date().toISOString(),
  });
  return toAsset({ id: created.id, fields: { ...input, uploaded_at: new Date().toISOString() } });
}

export async function updateAmandaMediaAsset(id: string, fields: Partial<Pick<AmandaMediaAsset, 'title' | 'sort_order' | 'is_visible'>>) {
  const saved = await airtableUpdate('media_assets', id, fields);
  if (!saved) throw new Error('Media asset could not be updated.');
  return saved;
}
