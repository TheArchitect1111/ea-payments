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
      `Photo is too large. Keep it under ${Math.round(CTP_ASSET_MAX_BYTES / (1024 * 1024))}MB.`,
    );
  }
  const mimeType = file.type || 'application/octet-stream';
  if (!isAllowedCtpAssetMime(mimeType)) {
    throw new Error('That file type is not supported. Use a photo (JPG/PNG) or PDF.');
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

export async function parseFactoryLaunchBody(
  request: NextRequest,
): Promise<{ ok: true; body: LaunchProjectInput } | { ok: false; error: string }> {
  const contentType = request.headers.get('content-type') || '';
  // Prefer JSON when explicitly JSON. Otherwise treat as form (multipart / urlencoded).
  // Do not require "multipart/form-data" substring — some runtimes omit or rewrite it.
  const preferJson = contentType.includes('application/json');

  if (!preferJson) {
    try {
      const form = await request.formData();
      const command = String(form.get('command') ?? form.get('text') ?? '').trim();
      const notes = String(form.get('notes') ?? '').trim();
      const file = form.get('image') ?? form.get('file');
      const attachments: FactoryAttachmentMeta[] = [];

      if (file instanceof File && file.size > 0) {
        attachments.push(await attachmentFromFile(file));
      }

      if (!command && attachments.length === 0) {
        return {
          ok: false,
          error: 'Enter a website, company name, or notes — or add a photo.',
        };
      }

      // Keep a neutral seed name — research vision renames to the real business.
      const resolvedCommand =
        command ||
        (attachments.length
          ? 'Launch Image capture'
          : '');

      if (!resolvedCommand) {
        return {
          ok: false,
          error: 'Enter a website, company name, or notes — or add a photo.',
        };
      }

      return {
        ok: true,
        body: {
          command: resolvedCommand,
          text: command || undefined,
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
    const body = (await request.json()) as LaunchProjectInput;
    return { ok: true, body };
  } catch {
    return { ok: false, error: 'Could not read launch details. Try again.' };
  }
}
