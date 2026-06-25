import sharp from 'sharp';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { renameSync } from 'node:fs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOME = join(__dirname, '..', 'public', 'home');

const ASSETS =
  'C:/Users/brick/.cursor/projects/c-Users-brick-ea-operating-system/assets';
const SRC_EVENT_BG = `${ASSETS}/c__Users_brick_AppData_Roaming_Cursor_User_workspaceStorage_66ff474ca80fe6078170a1345c532cac_images_150525eb-bfd1-4083-8a24-505bb55aab9e-35e78827-ce9d-4b1e-a90e-e9ab7a43e5d6.png`;
const SRC_EVENT_PORTAL = `${ASSETS}/c__Users_brick_AppData_Roaming_Cursor_User_workspaceStorage_66ff474ca80fe6078170a1345c532cac_images_abf8bddf-20b4-41b7-90fb-c84a67b89579-6560b0ce-eec3-47d9-9150-05bc769b7935.png`;

const PHONES = [
  'portal-coach.png',
  'portal-business.png',
  'portal-pastor.png',
  'portal-school.png',
  'portal-creator.png',
  'portal-pulse.png',
];

/** Flood-fill near-white background from the image edges -> transparent. */
async function keyOutBackground(file) {
  const src = join(HOME, file);
  const { data, info } = await sharp(src)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });
  const { width, height, channels } = info;

  const isBg = (i) => {
    const a = data[i + 3];
    if (a === 0) return true;
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    return min >= 226 && max - min <= 16; // near-white, low saturation
  };

  const visited = new Uint8Array(width * height);
  const stack = [];
  const push = (x, y) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const p = y * width + x;
    if (visited[p]) return;
    visited[p] = 1;
    stack.push(x, y);
  };
  for (let x = 0; x < width; x++) {
    push(x, 0);
    push(x, height - 1);
  }
  for (let y = 0; y < height; y++) {
    push(0, y);
    push(width - 1, y);
  }
  while (stack.length) {
    const y = stack.pop();
    const x = stack.pop();
    const i = (y * width + x) * channels;
    if (!isBg(i)) continue;
    data[i + 3] = 0;
    push(x + 1, y);
    push(x - 1, y);
    push(x, y + 1);
    push(x, y - 1);
  }

  const tmp = `${src}.tmp.png`;
  await sharp(data, { raw: { width, height, channels } })
    .trim()
    .png()
    .toFile(tmp);
  renameSync(tmp, src);
  console.log(`keyed ${file} (${width}x${height})`);
}

async function main() {
  for (const f of PHONES) await keyOutBackground(f);

  await sharp(SRC_EVENT_BG)
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(join(HOME, 'scene-event-registration.jpg'));
  console.log('wrote scene-event-registration.jpg');

  await sharp(SRC_EVENT_PORTAL)
    .png()
    .toFile(join(HOME, 'portal-event-registration.png'));
  console.log('wrote portal-event-registration.png');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
