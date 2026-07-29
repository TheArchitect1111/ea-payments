import { NextRequest } from 'next/server';
import {
  CTP_ASSET_MAX_BYTES,
  isAllowedCtpAssetMime,
  persistCtpAssetToStudio,
  storeCtpAsset,
} from '@/lib/ctp-asset-store';
import { factoryOrganizationId, type LaunchProjectInput } from '@/lib/factory-project';
import type { FactoryAttachmentMeta } from '@/lib/factory-project-store';

function publicBaseUrl(): string {
  const raw = (
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.EA_PLATFORM_URL ||
    'https://efficiencyarchitects.online'
  ).replace(/\/$/, '');
  return raw.replace(
    /^https?:\/\/www\.efficiencyarchitects\.online/i,
    'https://efficiencyarchitects.online',
  );
}

function mimeToAttachmentType(mime: string): FactoryAttachmentMeta['type'] {
  const lower = mime.toLowerCase();
  if (lower.startsWith('image/')) return 'image';
  if (lower === 'application/pdf') return 'pdf';
  if (lower.includes('powerpoint') || lower.includes('presentation')) return 'powerpoint';
  if (lower.includes('word') || lower.includes('document')) return 'word';
  if (lower.startsWith('text/')) return 'text';
  return 'other';
}

async function attachmentFromFile(file: File): Promise<FactoryAttachmentMeta> {
  if (file.size > CTP_ASSET_MAX_BYTES) {
    throw new Error(
      `File is too large. Keep it under ${Math.round(CTP_ASSET_MAX_BYTES / (1024 * 1024))}MB.`,
    );
  }
  const mimeType = file.type || 'application/octet-stream';
  if (!isAllowedCtpAssetMime(mimeType)) {
    throw new Error('That file type is not supported. Use a photo (JPG/PNG), PDF, or Word/PowerPoint.');
  }

  const bytes = Buffer.from(await file.arrayBuffer());
  const asset = await storeCtpAsset({
    draftToken: `factory-launch-${Date.now().toString(36)}`,
    assetType: 'factory-launch',
    fileName: file.name || 'launch-photo.jpg',
    mimeType,
    bytes,
  });
  await persistCtpAssetToStudio(asset.id, factoryOrganizationId());

  return {
    type: mimeToAttachmentType(mimeType),
    name: asset.fileName,
    url: `${publicBaseUrl()}${asset.url}`,
  };
}

function collectFiles(form: FormData): File[] {
  const files: File[] = [];
  for (const [key, value] of form.entries()) {
    if (!(value instanceof File) || value.size <= 0) continue;
    if (
      key === 'image' ||
      key === 'file' ||
      key.startsWith('file') ||
      key === 'attachment' ||
      key === 'attachments'
    ) {
      files.push(value);
    }
  }
  return files.slice(0, 6);
}

export type ParsedFactoryLaunch =
  | { ok: true; body: LaunchProjectInput; forceNew?: boolean }
  | { ok: false; error: string };

export async function parseFactoryLaunchBody(request: NextRequest): Promise<ParsedFactoryLaunch> {
  const contentType = request.headers.get('content-type') || '';
  const preferJson = contentType.includes('application/json');

  if (!preferJson) {
    try {
      const form = await request.formData();
      const command = String(form.get('command') ?? form.get('text') ?? '').trim();
      const notes = String(form.get('notes') ?? '').trim();
      const client = String(form.get('client') ?? form.get('companyName') ?? '').trim();
      const companyName = String(form.get('companyName') ?? '').trim();
      const url = String(form.get('url') ?? form.get('website') ?? '').trim();
      const goal = String(form.get('goal') ?? '').trim();
      const deliverable = String(form.get('deliverable') ?? '').trim();
      const industry = String(form.get('industry') ?? '').trim();
      const forceNew =
        String(form.get('forceNew') ?? '').trim() === '1' ||
        String(form.get('forceNew') ?? '').toLowerCase() === 'true';

      const attachments: FactoryAttachmentMeta[] = [];
      for (const file of collectFiles(form)) {
        attachments.push(await attachmentFromFile(file));
      }

      if (!command && !client && attachments.length === 0) {
        return {
          ok: false,
          error: 'Enter a website, company name, or notes — or add a photo.',
        };
      }

      const resolvedCommand =
        command ||
        (client ? `Launch ${client}` : '') ||
        (attachments.length ? 'Launch Image capture' : '');

      if (!resolvedCommand) {
        return {
          ok: false,
          error: 'Enter a website, company name, or notes — or add a photo.',
        };
      }

      return {
        ok: true,
        forceNew,
        body: {
          command: resolvedCommand,
          text: command || undefined,
          client: client || undefined,
          companyName: companyName || client || undefined,
          url: url || undefined,
          website: url || undefined,
          goal: goal || undefined,
          deliverable: deliverable || undefined,
          industry: industry || undefined,
          notes:
            notes ||
            (attachments[0]?.name ? `Launch photo: ${attachments[0].name}` : undefined),
          attachments,
        },
      };
    } catch (err) {
      return {
        ok: false,
        error: err instanceof Error ? err.message : 'Could not read the launch form.',
      };
    }
  }

  try {
    const body = (await request.json()) as LaunchProjectInput & { forceNew?: boolean | string };
    const forceNew =
      body.forceNew === true || body.forceNew === '1' || body.forceNew === 'true';
    return { ok: true, forceNew, body };
  } catch {
    return { ok: false, error: 'Could not read launch details. Try again.' };
  }
}
