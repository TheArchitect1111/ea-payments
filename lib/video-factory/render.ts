import { spawn } from 'node:child_process';
import fs from 'node:fs/promises';
import {
  VIDEO_FACTORY_ENTRY,
  VIDEO_FACTORY_PUBLIC_DIR,
  VIDEO_FACTORY_RENDERS_DIR,
  publicRenderedVideoPath,
  publicRenderedVideoUrl,
  renderedVideoPath,
} from './paths';
import { getVideoProject } from './registry';

export type RenderedVideo = {
  path: string;
  bytes: Buffer;
  previewUrl: string;
};

async function readIfPresent(filePath: string): Promise<Buffer | null> {
  try {
    const bytes = await fs.readFile(filePath);
    if (bytes.byteLength < 1000) return null;
    return bytes;
  } catch {
    return null;
  }
}

export async function findRenderedVideo(projectId: string): Promise<RenderedVideo | null> {
  const candidates = [renderedVideoPath(projectId), publicRenderedVideoPath(projectId)];
  for (const filePath of candidates) {
    const bytes = await readIfPresent(filePath);
    if (!bytes) continue;
    return {
      path: filePath,
      bytes,
      previewUrl: publicRenderedVideoUrl(projectId),
    };
  }
  return null;
}

export async function ensurePublicPreview(projectId: string): Promise<RenderedVideo | null> {
  const found = await findRenderedVideo(projectId);
  if (!found) return null;
  await fs.mkdir(VIDEO_FACTORY_PUBLIC_DIR, { recursive: true });
  const publicPath = publicRenderedVideoPath(projectId);
  if (found.path !== publicPath) {
    await fs.copyFile(found.path, publicPath);
  }
  const bytes = found.path === publicPath ? found.bytes : (await readIfPresent(publicPath)) ?? found.bytes;
  return {
    path: publicPath,
    bytes,
    previewUrl: publicRenderedVideoUrl(projectId),
  };
}

export async function renderVideoProject(projectId: string): Promise<RenderedVideo & { cached: boolean }> {
  const project = getVideoProject(projectId);
  if (!project) throw new Error(`Unknown video project: ${projectId}`);

  await fs.mkdir(VIDEO_FACTORY_RENDERS_DIR, { recursive: true });
  await fs.mkdir(VIDEO_FACTORY_PUBLIC_DIR, { recursive: true });
  const output = renderedVideoPath(projectId);

  await new Promise<void>((resolve, reject) => {
    const child = spawn(
      'npx',
      ['remotion', 'render', VIDEO_FACTORY_ENTRY, projectId, output, '--overwrite'],
      { stdio: ['ignore', 'pipe', 'pipe'], shell: true, env: process.env, cwd: process.cwd() },
    );
    let stderr = '';
    child.stderr?.on('data', (chunk) => {
      stderr += String(chunk);
    });
    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0) resolve();
      else reject(new Error(stderr.trim() || `Remotion exited ${code}`));
    });
  });

  await fs.copyFile(output, publicRenderedVideoPath(projectId));
  const bytes = await fs.readFile(publicRenderedVideoPath(projectId));
  return {
    path: publicRenderedVideoPath(projectId),
    bytes,
    previewUrl: publicRenderedVideoUrl(projectId),
    cached: false,
  };
}
