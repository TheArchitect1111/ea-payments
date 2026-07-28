/**
 * P0 contract: CaptureSuccess is production-wired (no stub-only checkboxes).
 * Zero Opportunity OS / pgvector / SIMPLIFI_OS_READ dependency.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const successPanel = readFileSync(join(root, 'app/components/CaptureSuccessPanel.tsx'), 'utf8');
const client = readFileSync(join(root, 'lib/simplifi-client.ts'), 'utf8');
const captureApp = readFileSync(join(root, 'app/simplifi/capture/SimplifiCaptureApp.tsx'), 'utf8');
const opportunityPage = readFileSync(join(root, 'app/simplifi/opportunity/[id]/page.tsx'), 'utf8');
const captureResponse = readFileSync(join(root, 'lib/capture-response.ts'), 'utf8');
const workspace = readFileSync(join(root, 'app/simplifi/workspace/SimplifiWorkspace.tsx'), 'utf8');

assert(!successPanel.includes("type=\"checkbox\""), 'CaptureSuccess must not use stub checkboxes');
assert(!successPanel.includes("'Add to Watch List',\n    'Set Reminder'"), 'old stub action list removed');
assert(successPanel.includes('createWatchListItem'), 'Watch List calls API helper');
assert(successPanel.includes('activeSaveCapture'), 'Follow-up calls active-save');
assert(successPanel.includes('snoozeCapture'), 'Reminder uses snooze API');
assert(successPanel.includes('Open Brief'), 'Primary CTA opens Brief');
assert(successPanel.includes('Opportunity profile'), 'Profile deep link present');
assert(successPanel.includes('decisionPath'), 'Surfaces Decision Intelligence insight');

assert(client.includes('createWatchListItem'), 'simplifi-client exports watch list create');
assert(client.includes('/api/portal/simplifi/watch-list'), 'watch list hits portal API');

assert(captureApp.includes('recordId={result.record.id}'), 'Capture app passes recordId');
assert(captureApp.includes('loggedIn={loggedIn}'), 'Capture app passes loggedIn');
assert(captureApp.includes('opportunityUrl'), 'Capture app passes opportunity URL');

assert(captureResponse.includes('decisionPath'), 'Analyze response includes decisionPath');
assert(captureResponse.includes('opportunityUrl'), 'Analyze response includes opportunityUrl');
assert(captureResponse.includes('parseOpportunityPayload'), 'Status response reads embedded intelligence');
assert(captureResponse.includes('buildCaptureStatusResponse'), 'Status builder present');
assert(!captureResponse.includes('SIMPLIFI_OS_READ'), 'No OS read flag in capture response');

assert(opportunityPage.includes('Decision Intelligence'), 'Opportunity profile surfaces Decision Intelligence');
assert(opportunityPage.includes('Why now'), 'Opportunity profile surfaces Why now');
assert(opportunityPage.includes('parseOpportunityPayload'), 'Reads embedded intelligence');

assert(workspace.includes('Why now'), 'Brief inbox surfaces Why now');
assert(workspace.includes('Connections'), 'Brief labels relationship clusters Connections');
assert(workspace.includes('Decision Intelligence'), 'Brief button renamed to Decision Intelligence');

assert(!successPanel.includes('pgvector'), 'P0 success panel has no pgvector');
assert(!successPanel.includes('simplifi-os'), 'P0 success panel has no OS module');

console.log('OK simplifi P0 capture-success + intelligence surface contract');
