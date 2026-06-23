#!/usr/bin/env node
/**
 * Print instructions for Client Records lifecycle fields on Airtable Payments base.
 * Usage: node scripts/setup-client-lifecycle-fields.mjs
 */

const LIFECYCLE_AIRTABLE_FIELDS = [
  'Lifecycle Stage',
  'Discovery Status',
  'Build Status',
  'Launch Status',
];

const FIELD_SPECS = [
  {
    name: 'Lifecycle Stage',
    type: 'singleSelect',
    options: [
      'Prospect',
      'Discovery',
      'Blueprint',
      'Agreement',
      'Onboarding',
      'Build',
      'Launch',
      'Adoption',
      'Optimization',
    ],
  },
  {
    name: 'Discovery Status',
    type: 'singleSelect',
    options: ['Not Scheduled', 'Scheduled', 'Completed', 'No Show', 'Follow-Up Needed'],
  },
  {
    name: 'Build Status',
    type: 'singleSelect',
    options: [
      'Not Started',
      'In Progress',
      'Awaiting Client',
      'Internal Review',
      'Client Review',
      'Approved',
      'Ready For Launch',
    ],
  },
  {
    name: 'Launch Status',
    type: 'singleSelect',
    options: ['Not Scheduled', 'Scheduled', 'Launched', 'Adoption In Progress'],
  },
];

console.log('EA OS Phase 1 — Client Records lifecycle fields\n');
console.log('Base: Payments (appv0YoLIMY45fmDA)');
console.log('Table: Client Records\n');
console.log('Add these Single select fields (exact names):\n');

for (const spec of FIELD_SPECS) {
  console.log(`## ${spec.name}`);
  for (const opt of spec.options) {
    console.log(`  - ${opt}`);
  }
  console.log('');
}

console.log('Code writes use typecast:true — options are created on first write if missing.\n');
console.log('Verify: node scripts/verify-airtable-schema.mjs (includes lifecycle check)\n');
console.log('Locked field names:', LIFECYCLE_AIRTABLE_FIELDS.join(', '));
