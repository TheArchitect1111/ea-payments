import { test, after } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { createEACommsBrick, type EACommsBrick } from '../index';
import checkoutAdapter from '../../adapters/checkout.adapter';
import type { Brick, CheckoutResult } from '../../BrickInterface';
import { TEMPLATE_REQUIREMENTS } from '../templates';
import type { CommsAuditRow, CommsAuditTable } from '../sendTemplate';

const portalRoot = mkdtempSync(join(tmpdir(), 'ea-comms-test-'));
mkdirSync(join(portalRoot, 'config'));
const config = {
  fromAddress: 'updates@example.com',
  replyTo: 'help@example.com',
  provider: 'resend',
  eventType: 'workshop',
  templates: {
    registration_confirmation: { subject: 'Confirmed {{eventDate}}', html: '<p>Link: {{eventLink}}</p>' },
    payment_receipt: { subject: 'Receipt {{price}}', html: '<p>Receipt: {{receiptLink}}</p>' },
    event_reminder: { subject: 'Reminder {{eventDate}}', html: '<p>{{eventLink}}</p>' },
    waitlist_update: { subject: 'Availability update', html: '<p>{{eventLink}}</p>' },
    sponsor_or_guest_thankyou: { subject: 'Thank you', html: '<p>Thank you for participating.</p>' },
    support_reply_approved: { subject: 'Support reply', html: '<p>{{message}}</p>' },
  },
};
const writeConfig = (value: unknown) => writeFileSync(join(portalRoot, 'config', 'comms.templates.json'), JSON.stringify(value));
writeConfig(config);
const priorKey = process.env.RESEND_API_KEY;
after(() => {
  if (priorKey === undefined) delete process.env.RESEND_API_KEY;
  else process.env.RESEND_API_KEY = priorKey;
  rmSync(portalRoot, { recursive: true, force: true });
});

const rows: CommsAuditRow[] = [];
let nextAuditId = 0;
const audit: CommsAuditTable = {
  async insert(row) {
    const id = 'audit-' + (++nextAuditId);
    rows.push({ ...row, id });
    return id;
  },
  async update(id, changes) {
    const row = rows.find(value => value.id === id);
    assert.ok(row);
    Object.assign(row, changes);
  },
  async list() { return rows.map(row => ({ ...row })); },
};
const sends: { url: string; body: Record<string, unknown> }[] = [];
const mockFetch: typeof fetch = async (request, init) => {
  sends.push({ url: String(request), body: JSON.parse(String(init?.body)) as Record<string, unknown> });
  return new Response(JSON.stringify({ id: 're-test-delivery' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
};
const brick = createEACommsBrick({ portalRoot, portalId: 'example-portal', auditTable: audit, fetchImpl: mockFetch });
const contact = { email: 'RECIPIENT@example.com', verified: true as const };

// Both variants must satisfy the chassis contract without ts-ignore or changed payment logic.
const typedComms: EACommsBrick = brick;
const typedPayment: Brick = checkoutAdapter;
test('generic chassis socket typing preserves legacy payment adapter', async () => {
  assert.equal(typedComms.price().currency, 'CAD');
  assert.equal((await typedComms.checkout({ type: 'stripe-test', courseId: 'example' })).notApplicable, true);
  const paid: CheckoutResult = await typedPayment.checkout({ type: 'stripe-test', courseId: 'example' });
  assert.match(paid.sessionId, /^cs_\d+_checkout$/);
  assert.ok(paid.entitlement.length > 0);
});

test('health: key and six complete templates return 200; missing key or config returns 503', async () => {
  delete process.env.RESEND_API_KEY;
  assert.equal((await brick.health()).status, 503);
  assert.equal(brick.attach(), false);
  process.env.RESEND_API_KEY = 're_test_fixture_value';
  assert.equal((await brick.health()).status, 200);
  assert.equal(brick.attach(), true);
  writeConfig({ ...config, templates: { registration_confirmation: config.templates.registration_confirmation } });
  assert.equal((await brick.health()).status, 503);
  assert.equal(brick.attach(), false);
  writeConfig(config);
  assert.equal((await brick.health()).status, 200);
});

test('price returns exact zero-dollar CAD inclusion contract', () => {
  assert.deepEqual(brick.price(), { currency: 'CAD', amount: 0, note: 'included with portal' });
});
test('checkout never creates a payment session', async () => {
  assert.deepEqual(await brick.checkout(), { notApplicable: true, reason: 'comms brick does not process payments' });
});
test('six exact allowed template IDs are registered', () => {
  assert.deepEqual(Object.keys(TEMPLATE_REQUIREMENTS).sort(), Object.keys(config.templates).sort());
});
test('welcome delegates to a real restricted sender and records provider ID', async () => {
  process.env.RESEND_API_KEY = 're_test_fixture_value';
  const result = await brick.welcome('registration_confirmation', contact,
    { eventDate: '2030-03-15', eventLink: 'https://example.com/attend' });
  assert.equal(result.status, 'sent');
  assert.equal(sends.at(-1)?.url, 'https://api.resend.com/emails');
  assert.deepEqual(sends.at(-1)?.body.to, ['recipient@example.com']);
  assert.equal(sends.at(-1)?.body.subject, 'Confirmed 2030-03-15');
  assert.equal(rows.at(-1)?.status, 'sent');
  assert.equal(rows.at(-1)?.providerMessageId, 're-test-delivery');
});
test('unknown template ID rejected before audit or network', async () => {
  const sendsBefore = sends.length, auditsBefore = rows.length;
  await assert.rejects(brick.sendTemplate('unlisted_mass_message', contact, {}), /Unapproved/);
  assert.equal(sends.length, sendsBefore);
  assert.equal(rows.length, auditsBefore);
});
test('missing required data produces durable draft and needs_approval, not an email', async () => {
  const before = sends.length;
  const result = await brick.sendTemplate('payment_receipt', contact, { price: '15.00' });
  assert.equal(result.status, 'needs_approval');
  if (result.status === 'needs_approval') assert.deepEqual(result.missingFields, ['receiptLink']);
  assert.equal(rows.at(-1)?.status, 'needs_approval');
  assert.equal(sends.length, before);
});
test('support reply only sends when explicitly approved', async () => {
  const before = sends.length;
  const result = await brick.sendTemplate('support_reply_approved', contact, { message: 'Approved answer', approved: false });
  assert.equal(result.status, 'needs_approval');
  assert.equal(sends.length, before);
});
test('reject invalid or unverified email', async () => {
  const before = sends.length;
  await assert.rejects(brick.sendTemplate('sponsor_or_guest_thankyou',
    { email: 'not-email', verified: true }, {}));
  await assert.rejects(brick.sendTemplate('sponsor_or_guest_thankyou',
    { email: 'person@example.com', verified: false } as never, {}));
  assert.equal(sends.length, before);
});
test('caller data is escaped in HTML, not invented', async () => {
  const result = await brick.sendTemplate('support_reply_approved', contact, { message: '<script>unsafe</script>', approved: true });
  assert.equal(result.status, 'sent');
  assert.match(String(sends.at(-1)?.body.html), /&lt;script&gt;/);
  assert.doesNotMatch(String(sends.at(-1)?.body.html), /<script>/);
});
test('getAuditLog exposes all isolated table records', async () => {
  const report = await brick.getAuditLog();
  assert.equal(report.length, rows.length);
  assert.ok(report.some(r => r.status === 'needs_approval'));
  assert.ok(report.some(r => r.status === 'sent'));
});
test('no client language appears in generic logic modules', () => {
  for (const file of ['index.ts', 'sendTemplate.ts', 'templates.ts']) {
    assert.doesNotMatch(readFileSync(resolve('src/chassis/ea-comms-brick', file), 'utf8'),
      new RegExp(['ama'+'nda','tarris','golf','gala'].join('|'),'i'), file);
  }
  // Configuration schema deliberately enumerates approved event types.
  assert.match(readFileSync('src/chassis/ea-comms-brick/config.schema.ts', 'utf8'), /eventType/);
});
