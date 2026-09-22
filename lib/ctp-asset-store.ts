import { mkdir, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { saveStudioRecord, loadStudioRecord } from '@/lib/creative-studio/persistence';

export type CtpAssetManifestEntry = {
  id: string;
  assetType: string;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedAt: string;
};

export type CtpAssetManifest = Record<string, CtpAssetManifestEntry>;

type StoredAssetMeta = {
  id: string;
  draftToken: string;
  assetType: string;
  fileName: string;
  mimeType: string;
  size: number;
  uploadedAt: string;
};

type ChunkPayload = {
  ctpAsset: true;
  assetId: string;
  chunkIndex: number;
  chunkCount: number;
  mimeType: string;
  fileName: string;
  assetType?: string;
  size: number;
  uploadedAt: string;
  data: string;
};

const CHUNK_BYTES = 65_000;
export const CTP_ASSET_MAX_BYTES = 2 * 1024 * 1024;

/** Non-organization scope used only until workspace provisioning resolves a persisted tenant. */
export function ctpAssetStagingScope(draftIdentity: string): string {
  const digest = createHash('sha256').update(draftIdentity.trim().toLowerCase()).digest('hex').slice(0, 20);
  return 'staging_ctp_' + digest;
}

const ALLOWED_MIME = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.ms-powerpoint',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  'text/plain',
  'video/mp4',
  'video/quicktime',
]);

const memoryMeta = new Map<string, StoredAssetMeta>();

function assetsDir(): string {
  return process.env.VERCEL
    ? path.join(os.tmpdir(), 'ctp-assets')
    : path.join(/* turbopackIgnore: true */ process.cwd(), '.data', 'ctp-assets');
}

function assetPath(id: string): string {
  return path.join(assetsDir(), `${id}.bin`);
}

function metaPath(id: string): string {
  return path.join(assetsDir(), `${id}.meta.json`);
}

export function isAllowedCtpAssetMime(mimeType: string): boolean {
  return ALLOWED_MIME.has(mimeType.toLowerCase());
}

export async function storeCtpAsset(input: {
  draftToken: string;
  assetType: string;
  fileName: string;
  mimeType: string;
  bytes: Buffer;
}): Promise<CtpAssetManifestEntry> {
  if (input.bytes.length > CTP_ASSET_MAX_BYTES) {
    throw new Error(`File exceeds ${Math.round(CTP_ASSET_MAX_BYTES / (1024 * 1024))}MB limit.`);
  }
  if (!isAllowedCtpAssetMime(input.mimeType)) {
    throw new Error('File type is not allowed for CTP uploads.');
  }

  const id = randomUUID();
  const uploadedAt = new Date().toISOString();
  const meta: StoredAssetMeta = {
    id,
    draftToken: input.draftToken,
    assetType: input.assetType,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.bytes.length,
    uploadedAt,
  };

  await mkdir(assetsDir(), { recursive: true });
  await writeFile(assetPath(id), input.bytes);
  await writeFile(metaPath(id), JSON.stringify(meta));
  memoryMeta.set(id, meta);

  return {
    id,
    assetType: input.assetType,
    fileName: input.fileName,
    mimeType: input.mimeType,
    size: input.bytes.length,
    url: `/api/ctp/assets/${id}`,
    uploadedAt,
  };
}

async function readMeta(id: string): Promise<StoredAssetMeta | null> {
  const cached = memoryMeta.get(id);
  if (cached) return cached;
  try {
    const raw = await readFile(metaPath(id), 'utf8');
    const meta = JSON.parse(raw) as StoredAssetMeta;
    memoryMeta.set(id, meta);
    return meta;
  } catch {
    return null;
  }
}

export async function readCtpAssetBytes(id: string): Promise<{ meta: StoredAssetMeta; bytes: Buffer } | null> {
  const meta = await readMeta(id);
  if (!meta) {
    const fromStudio = await loadChunkedAsset(id);
    if (!fromStudio) return null;
    return fromStudio;
  }

  try {
    const bytes = await readFile(assetPath(id));
    return { meta, bytes };
  } catch {
    const fromStudio = await loadChunkedAsset(id);
    return fromStudio;
  }
}

async function loadChunkedAsset(assetId: string): Promise<{ meta: StoredAssetMeta; bytes: Buffer } | null> {
  const first = await loadStudioRecord<ChunkPayload>('media', `ctpasset:${assetId}:0`);
  if (!first?.ctpAsset) return null;

  const chunkCount = first.chunkCount ?? 1;
  const chunks: Buffer[] = [];
  for (let i = 0; i < chunkCount; i += 1) {
    const chunk = await loadStudioRecord<ChunkPayload>('media', `ctpasset:${assetId}:${i}`);
    if (!chunk?.data) return null;
    chunks.push(Buffer.from(chunk.data, 'base64'));
  }

  const bytes = Buffer.concat(chunks);
  return {
    meta: {
      id: assetId,
      draftToken: '',
      assetType: first.assetType ?? 'asset',
      fileName: first.fileName,
      mimeType: first.mimeType,
      size: first.size ?? bytes.length,
      uploadedAt: first.uploadedAt ?? new Date().toISOString(),
    },
    bytes,
  };
}

export async function persistCtpAssetToStudio(
  assetId: string,
  organizationId: string,
): Promise<boolean> {
  const loaded = await readCtpAssetBytes(assetId);
  if (!loaded) return false;

  const { meta, bytes } = loaded;
  const chunkCount = Math.max(1, Math.ceil(bytes.length / CHUNK_BYTES));

  for (let index = 0; index < chunkCount; index += 1) {
    const slice = bytes.subarray(index * CHUNK_BYTES, (index + 1) * CHUNK_BYTES);
    const payload: ChunkPayload = {
      ctpAsset: true,
      assetId,
      chunkIndex: index,
      chunkCount,
      mimeType: meta.mimeType,
      fileName: meta.fileName,
      assetType: meta.assetType,
      size: meta.size,
      uploadedAt: meta.uploadedAt,
      data: slice.toString('base64'),
    };
    await saveStudioRecord({
      recordType: 'media',
      id: `ctpasset:${assetId}:${index}`,
      organizationId,
      title: meta.fileName,
      payload,
    });
  }

  return true;
}

export async function finalizeCtpAssetManifest(
  uploads: CtpAssetManifest | undefined,
  organizationId: string,
): Promise<CtpAssetManifest | undefined> {
  if (!uploads || !Object.keys(uploads).length) return undefined;

  const finalized: CtpAssetManifest = {};
  for (const [assetType, entry] of Object.entries(uploads)) {
    if (!entry?.id) continue;
    await persistCtpAssetToStudio(entry.id, organizationId);
    finalized[assetType] = entry;
  }
  return finalized;
}

export function parseAssetUploads(value: unknown): CtpAssetManifest | undefined {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  const manifest: CtpAssetManifest = {};
  for (const [key, raw] of Object.entries(value as Record<string, unknown>)) {
    if (!raw || typeof raw !== 'object') continue;
    const entry = raw as Partial<CtpAssetManifestEntry>;
    if (!entry.id || !entry.url) continue;
    manifest[key] = {
      id: String(entry.id),
      assetType: String(entry.assetType ?? key),
      fileName: String(entry.fileName ?? 'upload'),
      mimeType: String(entry.mimeType ?? 'application/octet-stream'),
      size: Number(entry.size ?? 0),
      url: String(entry.url),
      uploadedAt: String(entry.uploadedAt ?? new Date().toISOString()),
    };
  }
  return Object.keys(manifest).length ? manifest : undefined;
}
