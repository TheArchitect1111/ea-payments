import { handleUpload, type HandleUploadBody } from '@vercel/blob/client';
import { del, get } from '@vercel/blob';
import { NextRequest, NextResponse } from 'next/server';
import { spawn } from 'node:child_process';
import { mkdtemp, readFile, rm, stat, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { authorizeHqRequest } from '../../_lib/hq-auth';
import { savePublicMedia } from '../../_lib/hq-store';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 300;
const MAX_FILE = 250 * 1024 * 1024;
const SAFE_ID = /^[a-z0-9][a-z0-9-]{0,48}$/;

function runFfmpeg(args: string[]) {
  return new Promise<void>((resolve, reject) => {
    const child = spawn('ffmpeg', ['-hide_banner', '-loglevel', 'error', ...args], { stdio: ['ignore', 'ignore', 'pipe'] });
    let errorText = '';
    child.stderr.on('data', (chunk: Buffer) => { errorText = (errorText + chunk.toString()).slice(-4000); });
    child.on('error', reject);
    child.on('close', (code) => code === 0 ? resolve() : reject(new Error(errorText || `ffmpeg exited with code ${code}`)));
  });
}

function safeStem(name: string) {
  return name.toLowerCase().replace(/\.[^.]+$/, '').replace(/[^a-z0-9-]+/g, '-').replace(/^-|-$/g, '').slice(0, 70) || 'video';
}

async function transcode(id: string, pathname: string, name: string) {
  if (!SAFE_ID.test(id) || !pathname.startsWith(`data/upload-staging/${id}/`)) throw new Error('Invalid upload path.');
  let temp: string | undefined;
  try {
    const source = await get(pathname, { access: 'private', useCache: false });
    if (!source || source.statusCode !== 200) throw new Error('Uploaded source video was not found.');
    const bytes = Buffer.from(await new Response(source.stream).arrayBuffer());
    if (bytes.length > MAX_FILE) throw new Error('Video exceeds the 250 MB upload limit.');
    temp = await mkdtemp(join(tmpdir(), 'phone-hq-video-'));
    const input = join(temp, 'input');
    const output = join(temp, 'output.mp4');
    const poster = join(temp, 'poster.jpg');
    await writeFile(input, bytes);
    await runFfmpeg(['-i', input, '-vf', "scale=w='min(1920,iw)':h='min(1080,ih)':force_original_aspect_ratio=decrease:force_divisible_by=2,setsar=1", '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', '-y', output]);
    let posterReady = false;
    for (const second of [18, 8, 3, 0]) {
      try {
        await runFfmpeg(['-ss', String(second), '-i', output, '-frames:v', '1', '-q:v', '3', '-y', poster]);
        if ((await stat(poster)).size > 0) { posterReady = true; break; }
      } catch { /* Try the next poster frame time. */ }
    }
    if (!posterReady) throw new Error('Could not extract a poster frame.');
    const stem = safeStem(name);
    const stamp = Date.now();
    const [videoBlob, posterBlob] = await Promise.all([
      savePublicMedia(id, new File([await readFile(output)], `${stamp}-${stem}.mp4`, { type: 'video/mp4' }), 'video'),
      savePublicMedia(id, new File([await readFile(poster)], `${stamp}-${stem}-poster.jpg`, { type: 'image/jpeg' }), 'video'),
    ]);
    return { video: { url: videoBlob.url, pathname: videoBlob.pathname }, poster: { url: posterBlob.url, pathname: posterBlob.pathname }, transcoded: true };
  } finally {
    if (temp) await rm(temp, { recursive: true, force: true }).catch(() => {});
    await del(pathname, { access: 'private' }).catch(() => {});
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get('content-type')?.includes('multipart/form-data')) {
    const form = await req.formData();
    const projectId = String(form.get('projectId') ?? '');
    const kind = String(form.get('kind') ?? '');
    const auth = await authorizeHqRequest(req, 'admin:manage', { clientProjectId: projectId, allowClientContent: true });
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    if (kind !== 'image') return NextResponse.json({ error: 'Local fallback uploads support optimized photos only.' }, { status: 400 });
    const files = form.getAll('files').filter((entry): entry is File => typeof entry !== 'string');
    if (!files.length || files.length > 2) return NextResponse.json({ error: 'Upload the optimized JPG and WebP pair.' }, { status: 400 });
    if (auth.client && files.some((file) => !['image/jpeg', 'image/webp'].includes(file.type))) return NextResponse.json({ error: 'Client sessions can only upload JPG or WebP photos.' }, { status: 403 });
    if (files.some((file) => file.size > 300 * 1024 || !['image/jpeg', 'image/webp'].includes(file.type))) return NextResponse.json({ error: 'Each photo must be JPG or WebP and under 300 KB.' }, { status: 400 });
    try {
      const uploaded = await Promise.all(files.map((file) => savePublicMedia(projectId, file, 'image')));
      return NextResponse.json({ files: uploaded, storage: uploaded.some((file) => file.storage === 'local') ? 'local' : 'blob' });
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : 'Photo upload failed.' }, { status: 503 });
    }
  }
  const body = await req.clone().json().catch(() => null) as { action?: string; projectId?: string; pathname?: string; filename?: string } | null;
  if (body?.action === 'transcode') {
    const auth = await authorizeHqRequest(req, 'admin:manage');
    if (!auth.ok) return NextResponse.json({ error: auth.error }, { status: auth.status });
    try {
      return NextResponse.json(await transcode(body.projectId ?? '', body.pathname ?? '', body.filename ?? 'video'));
    } catch (error) {
      console.error('[phone-hq] video transcode failed', error);
      const message = error instanceof Error && /ENOENT/.test(error.message)
        ? 'The production runtime does not have ffmpeg installed. No video was published.'
        : error instanceof Error ? error.message : 'Video transcode failed. No video was published.';
      return NextResponse.json({ error: message }, { status: 503 });
    }
  }

  try {
    const response = await handleUpload({
      body: (await req.json()) as HandleUploadBody,
      request: req,
      onBeforeGenerateToken: async (pathname, clientPayload) => {
        const payload = JSON.parse(clientPayload ?? '{}') as { projectId?: string; kind?: string };
        const id = payload.projectId ?? '';
        const kind = payload.kind;
        const auth = kind === 'image'
          ? await authorizeHqRequest(req, 'admin:manage', { clientProjectId: id, allowClientContent: true })
          : await authorizeHqRequest(req, 'admin:manage');
        if (!auth.ok) throw new Error(auth.error);
        if (!SAFE_ID.test(id)) throw new Error('Choose a valid project.');
        if (kind === 'image' && !pathname.startsWith(`public/uploads/${id}/`)) throw new Error('Invalid image upload path.');
        if (kind === 'video' && !pathname.startsWith(`data/upload-staging/${id}/`)) throw new Error('Invalid video upload path.');
        if (kind !== 'image' && kind !== 'video') throw new Error('Invalid media type.');
        const allowedContentTypes = kind === 'image'
          ? ['image/jpeg', 'image/webp']
          : ['video/mp4', 'video/quicktime', 'video/webm', 'video/x-m4v'];
        return {
          allowedContentTypes,
          addRandomSuffix: true,
          tokenPayload: JSON.stringify({ id, kind }),
        };
      },
      onUploadCompleted: async () => {},
    });
    return NextResponse.json(response);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Media upload authorization failed.' }, { status: 400 });
  }
}
