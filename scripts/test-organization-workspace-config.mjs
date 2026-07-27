/**
 * Contract: Organizations Theme Id writes must not hard-fail on thin schemas.
 * Run: node scripts/test-organization-workspace-config.mjs
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const orgSrc = readFileSync(join(root, 'lib/organizations.ts'), 'utf8');
const schemaSrc = readFileSync(join(root, 'lib/organization-field-schema.ts'), 'utf8');
const fieldsSrc = readFileSync(join(root, 'lib/organization-workspace-fields.ts'), 'utf8');

assert.match(orgSrc, /filterExistingOrganizationFields/);
assert.match(orgSrc, /saveOrganizationWorkspaceOverlay/);
assert.match(orgSrc, /loadOrganizationWorkspaceOverlay/);
assert.match(orgSrc, /skipping Organizations columns not present/);
assert.match(orgSrc, /org-workspace-/);

assert.match(schemaSrc, /ensureOrganizationWorkspaceFields/);
assert.match(schemaSrc, /ORGANIZATION_WORKSPACE_FIELDS/);
assert.match(fieldsSrc, /Theme Id/);
assert.match(fieldsSrc, /Brand Colors/);

console.log('PASS: test-organization-workspace-config');
