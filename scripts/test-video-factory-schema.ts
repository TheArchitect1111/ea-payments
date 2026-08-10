import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { wealthyDebtProject } from '../lib/video-factory/projects/wealthy-debt';
import { listVideoProjects, resolveVideoProject } from '../lib/video-factory/registry';
import { parseVideoProject, projectDurationInFrames, projectDurationInSeconds } from '../lib/video-factory/schema';

const parsed = parseVideoProject(wealthyDebtProject);
assert.equal(parsed.id, 'wealthy-debt');
assert.equal(parsed.aspectRatio, '16:9');
assert.equal(parsed.width, 1920);
assert.equal(parsed.height, 1080);
assert.ok(parsed.scenes.length >= 8, 'first episode needs a full scene plan');
assert.ok(parsed.scenes.every((scene) => Boolean(scene.narration?.trim())), 'every episode scene must include narration');
assert.ok(projectDurationInSeconds(parsed) >= 60, 'episode should be at least a minute');
assert.equal(projectDurationInFrames(parsed), Math.round(projectDurationInSeconds(parsed) * parsed.fps));
assert.match(parsed.description, /not individualized/i);
assert.match(parsed.scenes.map((scene) => `${scene.body ?? ''} ${scene.headline ?? ''}`).join(' '), /magnif/i);
assert.equal(resolveVideoProject({ topic: 'Why wealthy people use debt differently.' }).id, 'wealthy-debt');
assert.ok(listVideoProjects().some((item) => item.id === 'wealthy-debt'));

const remotionIndex = fs.readFileSync(path.join('video-factory', 'remotion', 'index.ts'), 'utf8');
assert.match(remotionIndex, /registerRoot/);
const episode = fs.readFileSync(path.join('video-factory', 'remotion', 'EaEpisode.tsx'), 'utf8');
assert.match(episode, /CaptionLayer/);
assert.match(episode, /ChartScene/);
assert.match(episode, /SourceCitation/);
assert.match(episode, /<Audio/);
assert.match(episode, /video-factory\/audio/);

const narration = fs.readFileSync(path.join('lib', 'video-factory', 'narration.ts'), 'utf8');
assert.match(narration, /\/v1\/audio\/speech/);
assert.match(narration, /gpt-4o-mini-tts/);
assert.match(narration, /ensureProjectNarration/);
assert.match(narration, /OPENAI_API_KEY is required/);

const renderer = fs.readFileSync(path.join('lib', 'video-factory', 'render.ts'), 'utf8');
assert.match(renderer, /ensureProjectNarration\(project\)/);

const generateRoute = fs.readFileSync(path.join('app', 'api', 'integrations', 'video', 'generate', 'route.ts'), 'utf8');
assert.match(generateRoute, /optional-premium|Gemini/);
assert.match(generateRoute, /requireAdminSessionFromRequest/);

const publishRoute = fs.readFileSync(path.join('app', 'api', 'admin', 'video-factory', 'publish', 'route.ts'), 'utf8');
assert.match(publishRoute, /uploadYouTubeVideo/);
assert.match(publishRoute, /guardAdminApi/);

const renderRoute = fs.readFileSync(path.join('app', 'api', 'admin', 'video-factory', 'render', 'route.ts'), 'utf8');
assert.match(renderRoute, /previewUrl/);
assert.match(renderRoute, /guardAdminApi/);

const videoPage = fs.readFileSync(path.join('app', 'admin', 'video-test', 'page.tsx'), 'utf8');
assert.match(videoPage, /verifyAdminSession/);

function probeAvc1(filePath: string): { width: number; height: number } {
  const buf = fs.readFileSync(filePath);
  assert.equal(buf.subarray(4, 8).toString('ascii'), 'ftyp', `${filePath} is not an MP4`);
  const needle = Buffer.from('avc1');
  let idx = 0;
  while (idx < buf.length - 40) {
    const at = buf.indexOf(needle, idx);
    if (at < 0) break;
    const width = buf.readUInt16BE(at + 28);
    const height = buf.readUInt16BE(at + 30);
    if (width >= 16 && height >= 16 && width <= 7680 && height <= 4320) {
      return { width, height };
    }
    idx = at + 4;
  }
  throw new Error(`No avc1 visual sample found in ${filePath}`);
}

const previewMp4 = path.join('public', 'video-factory', 'wealthy-debt.mp4');
assert.ok(fs.existsSync(previewMp4), 'committed Remotion preview MP4 missing');
const previewStat = fs.statSync(previewMp4);
assert.ok(previewStat.size > 1_000_000, 'preview MP4 is too small to be a real 1080p episode');
const dims = probeAvc1(previewMp4);
assert.equal(dims.width, 1920);
assert.equal(dims.height, 1080);

console.log('Video factory schema + narration integration contract passed.');
console.log(`wealthy-debt duration ${projectDurationInSeconds(parsed)}s / ${projectDurationInFrames(parsed)} frames`);
console.log(`preview ${previewMp4} ${previewStat.size} bytes ${dims.width}x${dims.height}`);
