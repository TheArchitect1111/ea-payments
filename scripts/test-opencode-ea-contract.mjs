import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

const config = JSON.parse(await readFile(new URL('../opencode.json', import.meta.url), 'utf8'));
const guide = await readFile(new URL('../docs/opencode-ea-workflow.md', import.meta.url), 'utf8');

assert.equal(config.$schema, 'https://opencode.ai/config.json');
assert.equal(config.default_agent, 'plan');
assert.equal(config.share, 'disabled');
assert.equal(config.subagent_depth, 0);
assert.equal(config.permission.external_directory, 'deny');
assert.equal(config.permission.bash['rm *'], 'deny');
assert.equal(config.permission.bash['git reset*'], 'deny');
assert.equal(config.permission.bash['git push*'], 'deny');
assert.equal(config.command['ea-review'].agent, 'plan');
assert.match(config.command['ea-verify'].template, /Do not expand scope/);
assert.match(guide, /Do not treat a social-media claim that a model is “free” as approval/);

console.log('EA OpenCode safety contract: PASS');
