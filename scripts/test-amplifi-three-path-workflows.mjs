import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const app = readFileSync(join(root, 'app/amplifi/AmplifiPostApp.tsx'), 'utf8');
const home = readFileSync(join(root, 'app/amplifi/AmplifiHome.tsx'), 'utf8');
const watch = readFileSync(join(root, 'lib/amplifi/topic-watch.ts'), 'utf8');
const watchRoute = readFileSync(join(root, 'app/api/portal/amplifi/topic-research/watch/route.ts'), 'utf8');
const campaignRoute = readFileSync(join(root, 'app/api/portal/amplifi/create-campaign/route.ts'), 'utf8');
const research = readFileSync(join(root, 'lib/amplifi/topic-research.ts'), 'utf8');

assert.match(home, /I’ll create it/);
assert.match(home, /complete five-post campaign/);
assert.match(home, /up to three months/);

assert.match(app, /selectedPath === 'publish'/);
assert.match(app, /selectedPath === 'smartchitecture'/);
assert.match(app, /selectedPath === 'research'/);
assert.match(app, /Create my 5-post campaign/);
assert.match(app, /Posts created per search/);
assert.match(app, /Keep searching through/);
assert.doesNotMatch(app, /<option value="daily">/);

assert.match(campaignRoute, /exactly five coordinated social posts/i);
assert.match(campaignRoute, /parsed\.posts\.length !== 5/);
assert.match(research, /Create exactly \$\{input\.postCount \?\? 1\} distinct/);
assert.match(watch, /postsPerRun: 1 \| 2 \| 3/);
assert.match(watch, /endAt: string/);
assert.match(watchRoute, /within the next three months/);
assert.match(watchRoute, /\['twice-weekly', 'weekly'\]/);

console.log('Amplifi three-path workflow contracts: PASS');
