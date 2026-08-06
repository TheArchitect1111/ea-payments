import assert from 'node:assert/strict';
import fs from 'node:fs';

const auth = fs.readFileSync('lib/ea-admin-auth.ts', 'utf8');

assert.ok(auth.includes('EA_ADMIN_SESSION_DAYS = 30'), 'Admin session must remain active for 30 days.');
assert.ok(auth.includes("path: '/'"), 'Admin session must cover every admin route.');
assert.ok(auth.includes('httpOnly: true'), 'Admin session must remain unavailable to client-side scripts.');
assert.ok(auth.includes("sameSite: 'lax'"), 'Admin session must retain CSRF protection.');

console.log('Admin session duration and security contract passed.');
