#!/usr/bin/env node
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const projectId = process.argv[2] || 'wealthy-debt';
const outDir = path.join(process.cwd(), 'video-factory', 'renders');
const publicDir = path.join(process.cwd(), 'public', 'video-factory');
fs.mkdirSync(outDir, { recursive: true });
fs.mkdirSync(publicDir, { recursive: true });
const output = path.join(outDir, `${projectId}.mp4`);
const publicOutput = path.join(publicDir, `${projectId}.mp4`);
const entry = path.join('video-factory', 'remotion', 'index.ts');

const args = ['remotion', 'render', entry, projectId, output, '--overwrite'];
const child = spawn('npx', args, {
  stdio: 'inherit',
  shell: true,
  env: process.env,
  cwd: process.cwd(),
});

child.on('exit', (code) => {
  if (code !== 0) {
    console.error(`Remotion render failed with code ${code}`);
    process.exit(code ?? 1);
  }
  fs.copyFileSync(output, publicOutput);
  const stat = fs.statSync(publicOutput);
  console.log(`Rendered ${output}`);
  console.log(`Preview copy ${publicOutput} (${stat.size} bytes)`);
});
