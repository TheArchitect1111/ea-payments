import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');
const [config, gateway, types, env] = await Promise.all([
  read('lib/ai/config.ts'),
  read('lib/ai/gateway.ts'),
  read('lib/ai/types.ts'),
  read('.env.example'),
]);

assert.match(config, /OMNIROUTE_BASE_URL/);
assert.match(config, /OMNIROUTE_API_KEY/);
assert.match(config, /\[omniRoute, openAI\]/, 'OmniRoute must be attempted before direct OpenAI');
assert.match(gateway, /for \(const candidate of config\.providers\)/);
assert.match(gateway, /failures\.push/);
assert.match(gateway, /X-EA-AI-Provider/);
assert.match(types, /provider: 'omniroute' \| 'openai'/);
assert.match(env, /OMNIROUTE_BASE_URL=/);

console.log('EA OmniRoute gateway contract: PASS');
