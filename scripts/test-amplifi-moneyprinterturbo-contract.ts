import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const adapter = await readFile('lib/integrations/video/moneyprinterturbo.ts', 'utf8');
const route = await readFile('app/api/portal/amplifi/video-draft/route.ts', 'utf8');
const ui = await readFile('app/amplifi/AmplifiPostApp.tsx', 'utf8');

assert.match(adapter, /video_aspect: '9:16'/);
assert.match(adapter, /bgm_volume: 0/);
assert.match(adapter, /x-api-key/);
assert.match(adapter, /video\.origin !== worker\.origin/);
assert.doesNotMatch(adapter, /upload_post|auto_upload|publish/);
assert.match(route, /guardPortalApi/);
assert.match(route, /Cache-Control': 'private, no-store'/);
assert.match(ui, /Accept video/);
assert.match(ui, /Edit script/);
assert.match(ui, /Decline/);
assert.match(ui, /Nothing publishes automatically/);

process.env.AMPLIFI_VIDEO_WORKER_URL = 'https://video-worker.example.test';
process.env.AMPLIFI_VIDEO_WORKER_API_KEY = 'test-worker-key';
const requests: Array<{ url: string; init?: RequestInit }> = [];
const responses = [
  new Response(JSON.stringify({ status: 200, data: { task_id: '12345678-abcd-4321-abcd-123456789012' } }), { status: 200 }),
  new Response(JSON.stringify({ status: 200, data: { task_id: '12345678-abcd-4321-abcd-123456789012', state: 4, progress: 55 } }), { status: 200 }),
  new Response(JSON.stringify({ status: 200, data: { task_id: '12345678-abcd-4321-abcd-123456789012', state: 1, progress: 100, videos: ['/api/v1/download/12345678-abcd-4321-abcd-123456789012/final-1.mp4'] } }), { status: 200 }),
  new Response(new Uint8Array([0, 0, 0, 24]), { status: 200, headers: { 'Content-Type': 'video/mp4' } }),
];
globalThis.fetch = (async (input: string | URL | Request, init?: RequestInit) => {
  requests.push({ url: String(input), init });
  const response = responses.shift();
  if (!response) throw new Error('Unexpected worker request.');
  return response;
}) as typeof fetch;

const worker = await import('../lib/integrations/video/moneyprinterturbo.ts');
const started = await worker.startAmplifiVideoDraft({ subject: 'EA pilot', script: 'Test content only.' });
assert.equal(started.taskId, '12345678-abcd-4321-abcd-123456789012');
const submitted = JSON.parse(String(requests[0].init?.body));
assert.equal(submitted.video_aspect, '9:16');
assert.equal(submitted.bgm_volume, 0);
assert.equal(submitted.video_count, 1);
assert.equal(new Headers(requests[0].init?.headers).get('x-api-key'), 'test-worker-key');

const processing = await worker.getAmplifiVideoDraftStatus(started.taskId);
assert.equal(processing.state, 'processing');
assert.equal(processing.progress, 55);
const complete = await worker.getAmplifiVideoDraftStatus(started.taskId);
assert.equal(complete.state, 'complete');
assert.match(complete.workerVideoPath || '', /final-1\.mp4$/);
const download = await worker.downloadAmplifiVideoDraft(complete.workerVideoPath || '');
assert.equal(download.headers.get('content-type'), 'video/mp4');
assert.equal(requests[3].url, 'https://video-worker.example.test/api/v1/download/12345678-abcd-4321-abcd-123456789012/final-1.mp4');

await assert.rejects(
  () => worker.downloadAmplifiVideoDraft('https://attacker.example.test/stolen.mp4'),
  /unsafe download path/,
);

console.log('Amplifi MoneyPrinterTurbo pilot contract passed.');
