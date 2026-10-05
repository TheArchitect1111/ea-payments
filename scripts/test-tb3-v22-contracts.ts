import assert from 'node:assert/strict';
import { bookingSchema, activitySchema, calendarSchema, statusSchema, valuesCheck, hasTb3Identity, TB3_ORGANIZATION_ID } from '../lib/tb3/contracts';

const request_id = '858072f9-4b6b-44e6-a1c4-8fdcf1dd1201';
const booking = {contact_name: 'QA Contact', company_name: 'QA Community', contact_email: 'qa@example.com', type: 'Community', budget_range: 'In-Kind Community', vision_answer: 'Education for youth', request_id};
assert.equal(bookingSchema.safeParse(booking).success, true);
for (const injected of [{tenant_id: 'other'}, {status: 'Contracted'}, {earnings_amount: 999}, {values_check: 'Pass'}, {contract_pdf_url: 'https://example.com'}, {created_from: 'PortalManual'}]) {
  assert.equal(bookingSchema.safeParse({...booking, ...injected}).success, false);
}
assert.equal(bookingSchema.safeParse({...booking, date_requested: '2026-02-30'}).success, false);
assert.equal(bookingSchema.safeParse({...booking, contact_email: 'invalid'}).success, false);
assert.equal(valuesCheck('Youth education supported by a casino'), 'Fail');
assert.equal(valuesCheck('Community CBD campaign'), 'Fail');
assert.equal(valuesCheck('Faith and family'), 'Pass');
assert.equal(valuesCheck('Technology launch'), 'Review');
assert.equal(valuesCheck('Fashion company called Vineyard'), 'Review');
assert.equal(statusSchema.safeParse({status: 'Contracted'}).success, false);
assert.equal(statusSchema.safeParse({status: 'Contracted', earnings_amount: 0}).success, true);
assert.equal(statusSchema.safeParse({status: 'Completed', earnings_amount: -1}).success, false);
const event = {title: 'Tutor', type: 'Academics', linked_module: 'Academics', start_time: '2026-10-06T14:00:00-04:00', end_time: '2026-10-06T15:00:00-04:00'};
assert.equal(calendarSchema.safeParse(event).success, true);
assert.equal(calendarSchema.safeParse({...event, end_time: event.start_time}).success, false);
const log = {type: 'Workout', module: 'Training', title: 'Strength', start_time: event.start_time, duration_minutes: 60, request_id};
assert.equal(activitySchema.safeParse(log).success, true);
assert.equal(activitySchema.safeParse({...log, module: 'Academics'}).success, false);
assert.equal(activitySchema.safeParse({...log, kids_impacted: 12}).success, false);
assert.equal(hasTb3Identity({slug: 'tarris', orgId: TB3_ORGANIZATION_ID, email: 'qa@example.com', role: 'staff'}), true);
assert.equal(hasTb3Identity({slug: 'tarris', orgId: 'tarris-bouie-iii', email: 'qa@example.com', role: 'owner'}), false);
assert.equal(hasTb3Identity({slug: 'tarris', orgId: 'org_tarris', email: 'qa@example.com', role: 'owner'}), false);
assert.equal(hasTb3Identity({slug: 'other', orgId: TB3_ORGANIZATION_ID, email: 'qa@example.com', role: 'owner'}), false);
assert.equal(hasTb3Identity({slug: 'tarris', orgId: TB3_ORGANIZATION_ID, email: 'qa@example.com'}), false);
console.log('PASS: TB3 booking privilege rejection, dates, values precedence, earnings, activity scope, exact persisted tenant identity. Active membership must additionally be verified by server guard.');
