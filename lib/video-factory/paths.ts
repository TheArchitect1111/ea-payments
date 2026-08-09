import path from 'node:path';

export const VIDEO_FACTORY_ROOT = path.join(process.cwd(), 'video-factory');
export const VIDEO_FACTORY_RENDERS_DIR = path.join(VIDEO_FACTORY_ROOT, 'renders');
export const VIDEO_FACTORY_PUBLIC_DIR = path.join(process.cwd(), 'public', 'video-factory');
export const VIDEO_FACTORY_ENTRY = path.join(VIDEO_FACTORY_ROOT, 'remotion', 'index.ts');

export function renderedVideoPath(projectId: string): string {
  return path.join(VIDEO_FACTORY_RENDERS_DIR, `${projectId}.mp4`);
}

export function publicRenderedVideoPath(projectId: string): string {
  return path.join(VIDEO_FACTORY_PUBLIC_DIR, `${projectId}.mp4`);
}

export function publicRenderedVideoUrl(projectId: string): string {
  return `/video-factory/${projectId}.mp4`;
}
