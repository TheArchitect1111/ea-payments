const TASK_COMPLETE = 1;
const TASK_FAILED = -1;

type WorkerEnvelope<T> = {
  status?: number;
  message?: string;
  data?: T;
};

type WorkerTask = {
  task_id?: string;
  state?: number;
  progress?: number;
  videos?: string[];
  combined_videos?: string[];
  failed_stage?: string;
  error?: string;
};

export type AmplifiVideoDraftStatus = {
  taskId: string;
  state: 'processing' | 'complete' | 'failed';
  progress: number;
  error?: string;
  workerVideoPath?: string;
};

function workerConfig() {
  const baseUrl = process.env.AMPLIFI_VIDEO_WORKER_URL?.trim().replace(/\/$/, '');
  const apiKey = process.env.AMPLIFI_VIDEO_WORKER_API_KEY?.trim();
  if (!baseUrl || !apiKey) throw new Error('Amplifi video worker is not configured.');
  const url = new URL(baseUrl);
  if (url.protocol !== 'https:' && url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') {
    throw new Error('Amplifi video worker must use HTTPS.');
  }
  return { baseUrl: url.toString().replace(/\/$/, ''), apiKey };
}

function taskId(value: unknown): string {
  const id = String(value ?? '').trim();
  if (!/^[a-zA-Z0-9-]{8,80}$/.test(id)) throw new Error('Video worker returned an invalid task ID.');
  return id;
}

async function workerRequest<T>(path: string, init?: RequestInit): Promise<T> {
  const { baseUrl, apiKey } = workerConfig();
  const response = await fetch(`${baseUrl}${path}`, {
    ...init,
    headers: {
      Accept: 'application/json',
      'x-api-key': apiKey,
      ...(init?.headers ?? {}),
    },
    cache: 'no-store',
  });
  const payload = (await response.json().catch(() => ({}))) as WorkerEnvelope<T>;
  if (!response.ok || payload.status && payload.status >= 400 || !payload.data) {
    throw new Error(payload.message || `Video worker request failed (${response.status}).`);
  }
  return payload.data;
}

export function moneyPrinterTurboConfigured(): boolean {
  return Boolean(
    process.env.AMPLIFI_VIDEO_WORKER_URL?.trim() &&
    process.env.AMPLIFI_VIDEO_WORKER_API_KEY?.trim(),
  );
}

export async function startAmplifiVideoDraft(input: {
  subject: string;
  script: string;
}): Promise<{ taskId: string }> {
  const subject = input.subject.trim().slice(0, 500);
  const script = input.script.trim().slice(0, 8000);
  if (!subject || !script) throw new Error('A subject and reviewed script are required.');

  const data = await workerRequest<WorkerTask>('/api/v1/videos', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      video_subject: subject,
      video_script: script,
      video_aspect: '9:16',
      video_count: 1,
      video_source: 'pexels',
      video_clip_duration: 4,
      video_concat_mode: 'sequential',
      match_materials_to_script: true,
      subtitle_enabled: true,
      bgm_type: '',
      bgm_file: '',
      bgm_volume: 0,
      voice_name: 'en-US-JennyNeural-Female',
      paragraph_number: 1,
    }),
  });
  return { taskId: taskId(data.task_id) };
}

export async function getAmplifiVideoDraftStatus(rawTaskId: string): Promise<AmplifiVideoDraftStatus> {
  const id = taskId(rawTaskId);
  const data = await workerRequest<WorkerTask>(`/api/v1/tasks/${encodeURIComponent(id)}`);
  const files = data.combined_videos?.length ? data.combined_videos : data.videos;
  const workerVideoPath = files?.[0];
  const state = data.state === TASK_COMPLETE && workerVideoPath
    ? 'complete'
    : data.state === TASK_FAILED || data.error
      ? 'failed'
      : 'processing';
  return {
    taskId: id,
    state,
    progress: Math.max(0, Math.min(100, Number(data.progress) || 0)),
    ...(state === 'failed' ? { error: data.error || `Video generation failed at ${data.failed_stage || 'an unknown stage'}.` } : {}),
    ...(state === 'complete' ? { workerVideoPath } : {}),
  };
}

export async function downloadAmplifiVideoDraft(workerVideoPath: string): Promise<Response> {
  const { baseUrl, apiKey } = workerConfig();
  const worker = new URL(baseUrl);
  const video = new URL(workerVideoPath, `${baseUrl}/`);
  if (video.origin !== worker.origin || !video.pathname.toLowerCase().endsWith('.mp4')) {
    throw new Error('Video worker returned an unsafe download path.');
  }
  const response = await fetch(video, {
    headers: { 'x-api-key': apiKey, Accept: 'video/mp4' },
    cache: 'no-store',
  });
  if (!response.ok || !response.body) throw new Error(`Video draft download failed (${response.status}).`);
  return response;
}
