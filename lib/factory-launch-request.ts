import { NextRequest } from 'next/server';
import {
  CTP_ASSET_MAX_BYTES,
  isAllowedCtpAssetMime,
  persistCtpAssetToStudio,
  storeCtpAsset,
} from '@/lib/ctp-asset-store';
import { factoryOrganizationId, type LaunchProjectInput } from '@/lib/factory-project';
import type { FactoryAttachmentMeta } from '@/lib/factory-project-store';
import { ScreenshotBuildInput } from '@/lib/factory-screenshot-build';

export function validateScreenshotLaunch(body: LaunchProjectInput): void {
  if (body.buildMode !== undefined && body.buildMode !== 'exploratory' && body.buildMode !== 'screenshot') throw new Error('Unknown build mode.');
  if (body.buildMode !== 'screenshot') {
    if (body.screenshotBuild) throw new Error('Screenshot specifications require Screenshot Build Mode.');
    return;
  }
  body.screenshotBuild = ScreenshotBuildInput.parse(body.screenshotBuild);
  if (!Array.isArray(body.attachments) || body.attachments.length < 1 || body.attachments.length > 24 ||
    body.attachments.some(a => a.type !== 'image' || !a.url?.match(/\/api\/ctp\/assets\/[a-zA-Z0-9_-]+$/)))
    throw new Error('Use 1–24 uploaded image attachments for Screenshot Build Mode.');
  for (const page of body.screenshotBuild.pages) {
    const attachment = body.attachments?.[page.attachmentIndex];
    if (attachment?.type !== 'image' || !attachment.url?.match(/\/api\/ctp\/assets\/[a-zA-Z0-9_-]+$/))
      throw new Error(`Uploaded image required for page ${page.id}.`);
  }
  for (const binding of body.screenshotBuild.imageBindings) {
    if (body.attachments?.[binding.attachmentIndex]?.type !== 'image') throw new Error('Approved image attachment is missing.');
  }
}

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

export async function attachmentFromFile(file: File, options?: { requireDurable?: boolean }): Promise<FactoryAttachmentMeta> {
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
  const persisted = await persistCtpAssetToStudio(asset.id, factoryOrganizationId());
  if (options?.requireDurable && !persisted) throw new Error('Screenshot upload could not be durably saved.');

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
  if (files.length > 24) throw new Error('Use at most 24 attachments.');
  return files;
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

      const buildMode = String(form.get('buildMode') || 'exploratory') as LaunchProjectInput['buildMode'];
      const screenshotBuild = form.get('screenshotBuild') ? JSON.parse(String(form.get('screenshotBuild'))) : undefined;

      const attachments: FactoryAttachmentMeta[] = [];
      for (const file of collectFiles(form)) {
        attachments.push(await attachmentFromFile(file, { requireDurable: buildMode === 'screenshot' }));
      }
      const modeInput = { buildMode, screenshotBuild, attachments };
      validateScreenshotLaunch(modeInput);

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
          ...modeInput,
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
    validateScreenshotLaunch(body);
    const forceNew =
      body.forceNew === true || body.forceNew === '1' || body.forceNew === 'true';
    return { ok: true, forceNew, body };
  } catch {
    return { ok: false, error: 'Could not read launch details. Try again.' };
  }
}
