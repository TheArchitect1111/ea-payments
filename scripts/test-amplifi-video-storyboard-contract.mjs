import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [engine, route, ui] = await Promise.all([
  read('lib/amplifi-video-storyboard.ts'),
  read('app/api/portal/amplifi/video-storyboard/route.ts'),
  read('app/amplifi/AmplifiPostApp.tsx'),
]);

assert.match(engine, /Never claim to have watched a video/);
assert.match(engine, /structured-fallback/);
assert.match(engine, /durationSeconds/);
assert.match(route, /guardPortalApi/);
assert.match(route, /valid public video URL/);
assert.match(ui, /Analyze reference video/);
assert.match(ui, /Shot-by-shot storyboard/);
assert.match(ui, /video-storyboard/);

console.log('Amplifi video storyboard contract: PASS');
