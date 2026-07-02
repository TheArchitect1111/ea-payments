import QRCode from 'qrcode';

function escapeSvgText(value: string): string {
  return value.replace(/[<>&"]/g, (char) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;' }[char] ?? char));
}

export function connectQrFilename(label: string, ext: 'svg' | 'png'): string {
  const base = label.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'connect-qr';
  return `${base}.${ext}`;
}

export async function renderConnectQrSvg(url: string, label: string): Promise<string> {
  const qr = await QRCode.toString(url, {
    type: 'svg',
    margin: 2,
    width: 720,
    color: { dark: '#111111', light: '#ffffff' },
  });

  const caption = escapeSvgText(label);
  return qr.replace(
    '</svg>',
    `<text x="50%" y="96%" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#111111">${caption}</text></svg>`,
  );
}

export async function renderConnectQrPng(url: string): Promise<Buffer> {
  return QRCode.toBuffer(url, {
    type: 'png',
    margin: 2,
    width: 720,
    color: { dark: '#111111', light: '#ffffff' },
  });
}
