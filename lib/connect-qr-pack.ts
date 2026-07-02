import JSZip from 'jszip';
import type { ConnectKit, ConnectKitLink } from '@/lib/connect-kit';
import { connectQrFilename, renderConnectQrPng, renderConnectQrSvg } from '@/lib/connect-qr-render';

export type QrPackFilter = 'all' | 'event' | 'staff';

function matchesFilter(link: ConnectKitLink, filter: QrPackFilter): boolean {
  if (filter === 'all') return true;
  const note = link.note.toLowerCase();
  if (filter === 'event') return note.includes('event');
  if (filter === 'staff') return note.includes('staff');
  return true;
}

function manifestSection(kit: ConnectKit, links: ConnectKitLink[], format: 'png' | 'svg'): string {
  const lines = [
    `# Connect QR Pack — ${kit.orgName}`,
    `# Org: ${kit.orgSlug}`,
    `# Generated: ${new Date().toISOString()}`,
    `# Format: ${format.toUpperCase()}`,
    '',
    'Label | Type | URL | File',
    '---',
  ];

  for (const link of links) {
    const file = connectQrFilename(link.label, format);
    lines.push(`${link.label} | ${link.note} | ${link.url} | ${file}`);
  }

  lines.push('', `Kit page: ${kit.kitPageUrl}`, `Default capture: ${kit.captureUrl}`);
  return lines.join('\n');
}

export async function buildConnectQrPackZip(
  kit: ConnectKit,
  options?: { filter?: QrPackFilter; format?: 'png' | 'svg' },
): Promise<{ buffer: Buffer; count: number; filename: string }> {
  const filter = options?.filter ?? 'all';
  const format = options?.format ?? 'png';
  const links = kit.links.filter((link) => matchesFilter(link, filter));

  if (!links.length) {
    throw new Error(`No QR links match filter "${filter}".`);
  }

  const zip = new JSZip();
  const folder = zip.folder(`connect-qr-${kit.orgSlug}`) ?? zip;

  for (let i = 0; i < links.length; i += 1) {
    const link = links[i];
    const prefix = String(i + 1).padStart(2, '0');
    const file = `${prefix}-${connectQrFilename(link.label, format)}`;
    const bytes =
      format === 'svg'
        ? Buffer.from(await renderConnectQrSvg(link.url, link.label), 'utf8')
        : await renderConnectQrPng(link.url);
    folder.file(file, bytes);
  }

  folder.file('manifest.txt', manifestSection(kit, links, format));

  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
  const suffix = filter === 'all' ? 'all' : filter;
  return {
    buffer,
    count: links.length,
    filename: `connect-qr-${kit.orgSlug}-${suffix}.zip`,
  };
}

export function buildConnectPrintPackHtml(kit: ConnectKit, filter: QrPackFilter = 'all'): string {
  const links = kit.links.filter((link) => matchesFilter(link, filter));
  if (!links.length) {
    throw new Error(`No QR links match filter "${filter}".`);
  }

  const cards = links
    .map(
      (link) => `
      <section class="card">
        <img src="${link.qrPath}" alt="${escapeHtml(link.label)}" width="280" height="280" />
        <h2>${escapeHtml(link.label)}</h2>
        <p class="meta">${escapeHtml(link.note)}</p>
        <p class="url">${escapeHtml(link.url)}</p>
      </section>`,
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(kit.orgName)} — Connect QR Pack</title>
  <style>
    * { box-sizing: border-box; }
    body { font-family: Inter, Arial, sans-serif; margin: 0; padding: 24px; color: #111; background: #fff; }
    header { margin-bottom: 24px; border-bottom: 2px solid #c9a844; padding-bottom: 12px; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    .sub { color: #64748b; margin: 0; }
    .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px; }
    .card { border: 1px solid #e2e8f0; border-radius: 12px; padding: 16px; page-break-inside: avoid; }
    .card h2 { margin: 12px 0 4px; font-size: 18px; }
    .meta { margin: 0; font-size: 11px; text-transform: uppercase; letter-spacing: 0.08em; color: #94a3b8; }
    .url { margin: 8px 0 0; font-size: 12px; word-break: break-all; color: #475569; }
    @media print {
      body { padding: 12px; }
      .no-print { display: none; }
      .card { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <header>
    <h1>${escapeHtml(kit.orgName)} Connect QR Pack</h1>
    <p class="sub">${links.length} code(s) · Print this page or Save as PDF from your browser.</p>
    <p class="sub no-print"><a href="${escapeHtml(kit.kitPageUrl)}">Back to Connect kit</a></p>
  </header>
  <div class="grid">${cards}</div>
  <script>if (new URLSearchParams(location.search).get('autoprint') === '1') window.print();</script>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}
