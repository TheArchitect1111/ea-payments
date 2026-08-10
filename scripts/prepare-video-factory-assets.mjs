import fs from 'node:fs/promises';
import path from 'node:path';

const project = process.argv[2] || 'wealthy-debt';

const manifests = {
  'wealthy-debt': {
    'finance-skyline.jpg': 'https://images.pexels.com/photos/5058118/pexels-photo-5058118.jpeg?cs=srgb&dl=pexels-maxavans-5058118.jpg&fm=jpg',
    'apartments.jpg': 'https://images.pexels.com/photos/5502228/pexels-photo-5502228.jpeg?cs=srgb&dl=pexels-curtis-adams-1694007-5502228.jpg&fm=jpg',
    'charlotte.jpg': 'https://images.pexels.com/photos/8837580/pexels-photo-8837580.jpeg?cs=srgb&dl=pexels-ai25studio-8837580.jpg&fm=jpg',
    'manhattan.jpg': 'https://images.pexels.com/photos/5058118/pexels-photo-5058118.jpeg?cs=srgb&dl=pexels-maxavans-5058118.jpg&fm=jpg',
  },
};

const manifest = manifests[project];
if (!manifest) throw new Error(`No local-media manifest for video project: ${project}`);

const dir = path.join(process.cwd(), 'public', 'video-factory', 'media', project);
await fs.mkdir(dir, { recursive: true });

for (const [filename, url] of Object.entries(manifest)) {
  const target = path.join(dir, filename);
  let validExisting = false;
  try {
    const stat = await fs.stat(target);
    validExisting = stat.size > 10_000;
  } catch {}

  if (validExisting) {
    console.log(`Using cached media: ${target}`);
    continue;
  }

  console.log(`Fetching ${filename}`);
  const response = await fetch(url, { redirect: 'follow' });
  if (!response.ok) throw new Error(`Asset fetch failed for ${filename}: HTTP ${response.status}`);
  const type = response.headers.get('content-type') || '';
  if (!type.startsWith('image/')) throw new Error(`Asset ${filename} returned non-image content-type: ${type}`);

  const bytes = Buffer.from(await response.arrayBuffer());
  if (bytes.byteLength <= 10_000) throw new Error(`Asset ${filename} is suspiciously small (${bytes.byteLength} bytes)`);
  await fs.writeFile(target, bytes);
  console.log(`Cached ${filename}: ${bytes.byteLength} bytes`);
}

console.log(`Local media ready for ${project}.`);
