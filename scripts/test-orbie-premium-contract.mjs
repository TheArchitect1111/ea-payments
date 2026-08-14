import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const web = readFileSync('app/simplifi/components/GlobalOrb.tsx', 'utf8');
const css = readFileSync('app/simplifi/components/global-orb.css', 'utf8');
const native = readFileSync('mobile/src/components/OrbieCompanion.tsx', 'utf8');
const layout = readFileSync('mobile/app/(app)/_layout.tsx', 'utf8');

for (const action of ['Save with note', 'Investigate', 'Ask Orbie', 'Remind me']) {
  assert.ok(web.includes(action), `web Orbie missing ${action}`);
  assert.ok(native.includes(action), `native Orbie missing ${action}`);
}
assert.ok(web.includes('handleOrbDoubleClick') && web.includes('captureCurrentPage'), 'web Orbie tap flow missing');
assert.ok(web.includes('onPointerDown={beginHold}') && web.includes('startVoice'), 'web Orbie hold-to-speak missing');
assert.ok(native.includes('now - lastTapRef.current < 320'), 'native Orbie double-tap menu missing');
assert.ok(web.includes('global-orb-filaments') && css.includes('.global-orb-plasma'), 'web Orbie missing electric plasma system');
assert.ok(css.includes('#7cf5ff') && css.includes('#bd65ff'), 'web Orbie missing cyan-violet glass palette');
assert.ok(native.includes('styles.plasmaCore') && native.includes('styles.filamentFive'), 'native Orbie missing plasma filaments');
assert.ok(!web.includes('>\n        ORB\n'), 'legacy ORB wordmark must be removed');
assert.ok(native.includes('accessibilityLabel="Orbie, Simplifi assistant"'), 'native accessibility label missing');
assert.ok(layout.includes('<OrbieCompanion />'), 'native Orbie must appear on every authenticated screen');

console.log('Orbie premium web + native contract passed.');
