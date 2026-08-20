import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [page, client, route, extraction, intelligence] = await Promise.all([
  read('app/admin/ea-factory/training-transformations/page.tsx'),
  read('app/admin/ea-factory/training-transformations/TrainingTransformationsClient.tsx'),
  read('app/api/intelligence/training-transformation/route.ts'),
  read('lib/ea-document-extraction.ts'),
  read('lib/ea-intelligence.ts'),
]);

assert.match(page, /Hōnen/);
assert.match(client, /Upload file/);
assert.match(client, /Paste text/);
assert.match(client, /Nothing publishes until an administrator reviews and approves it/);
assert.match(client, /\/api\/intelligence\/training-transformation/);
for (const extension of ['.pdf', '.docx', '.pptx', '.txt', '.vtt', '.srt']) assert.match(client, new RegExp(extension.replace('.', '\\.')));
assert.match(route, /extractTrainingSourceFromFile/);
assert.match(extraction, /extractPdf/);
assert.match(extraction, /extractDocx/);
assert.match(extraction, /extractPptx/);
for (const output of ['lesson', 'quiz', 'checklist', 'knowledge-base-article', 'manager-summary']) assert.match(intelligence, new RegExp(`type: '${output}'`));

console.log('Hōnen course builder contract: PASS');
