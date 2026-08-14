import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const web = readFileSync('app/simplifi/components/GlobalOrb.tsx', 'utf8');
const css = readFileSync('app/simplifi/components/global-orb.css', 'utf8');
const native = readFileSync('mobile/src/components/OrbieCompanion.tsx', 'utf8');
const layout = readFileSync('mobile/app/(app)/_layout.tsx', 'utf8');

for (const action of ['Capture anything', 'Ask Simplifi', 'Add note', 'Quick actions']) {
  assert.ok(web.includes(action), `web Orbie missing ${action}`);
  assert.ok(native.includes(action), `native Orbie missing ${action}`);
}
assert.ok(web.includes('global-orb-orbit--one') && css.includes('.global-orb-orbit'), 'web Orbie missing gold energy orbit');
assert.ok(css.includes('--orb-cyan'), 'web Orbie missing cyan visual token');
assert.ok(!web.includes('>\n        ORB\n'), 'legacy ORB wordmark must be removed');
assert.ok(native.includes('accessibilityLabel="Orbie, Simplifi assistant"'), 'native accessibility label missing');
assert.ok(layout.includes('<OrbieCompanion />'), 'native Orbie must appear on every authenticated screen');

console.log('Orbie premium web + native contract passed.');
