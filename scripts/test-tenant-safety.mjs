import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (file) => readFileSync(join(root, file), 'utf8');

const middleware = read('middleware.ts');
assert.doesNotMatch(middleware, /payload\.role \?\? 'owner'/, 'Admin proxy must not default a missing role to owner');
assert.match(middleware, /typeof payload\.role !== 'string'/, 'Admin proxy must reject a missing role');

const memberships = read('lib/memberships.ts');
assert.doesNotMatch(memberships, /return \{ role: 'owner', membership: null \}/, 'Membership failures must not elevate to owner');
assert.match(memberships, /return \{ role: 'guest', membership: null \}/, 'Membership failures should resolve to guest');

const organizations = read('lib/organizations.ts');
assert.match(organizations, /NODE_ENV !== 'production'/, 'Production must reject synthetic organization fallback');
assert.match(organizations, /Platform store is required/, 'Production provisioning must require persistence');

const modules = read('lib/modules/portal-modules.ts');
assert.doesNotMatch(modules, /input\.role \?\? 'owner'/, 'Module access must not default to owner');

const gateway = read('lib/ai/gateway.ts');
assert.match(gateway, /actor\.portalSlug.*actor\.id/, 'AI history must derive an actor or tenant scope');
assert.match(gateway, /actor\.type.*tenantScope.*conversationId/, 'AI history key must namespace conversation IDs');
assert.doesNotMatch(gateway, /conversationHistory\.get\(request\.conversationId\)/, 'AI history must not use conversation ID alone');

const captures = read('lib/capture-records.ts');
assert.match(captures, /LOWER\(\{Portal Slug\}\)/, 'Capture query must use the dedicated tenant field');
assert.match(captures, /record\.portalSlug/, 'Capture results must re-check the dedicated tenant field');
assert.doesNotMatch(captures, /filterByFormula: `OR\(\{Source\}/, 'Capture tenancy must not query Source');


const guideProgress = read('app/api/ea-guide/progress/route.ts');
assert.match(guideProgress, /resolveSessionFromRequest/, 'Guide progress must require a session');
assert.doesNotMatch(guideProgress, /searchParams\.get\('userId'\)/, 'Guide progress must not select users from query parameters');
assert.match(guideProgress, /userId: identity\.userId/, 'Guide writes must use the session actor');

const guideAsk = read('app/api/ea-guide/ask/route.ts');
assert.doesNotMatch(guideAsk, /body\\.organizationId/, 'Guide questions must not trust body organizationId');

const guideEscalate = read('app/api/ea-guide/escalate/route.ts');
assert.match(guideEscalate, /guardAdminApi\(request\)/, 'Escalation listing must be admin-only');
assert.doesNotMatch(guideEscalate, /body\\.organizationId/, 'Escalations must not trust body organizationId');


const captureAuth = read('lib/capture-auth.ts');
assert.match(captureAuth, /createCaptureTenantToken/, 'Capture auth must issue scoped tokens');
assert.match(captureAuth, /capture-tenant:v1:/, 'Capture tokens must use a versioned tenant scope');

const captureBootstrap = read('app/api/extension/bootstrap/route.ts');
assert.match(captureBootstrap, /createCaptureTenantToken\(session\.slug\)/, 'Bootstrap must issue a tenant-scoped capture token');

const captureIngest = read('app/api/capture/ingest/route.ts');
assert.match(captureIngest, /portalSlug: tokenSlug \?\? undefined/, 'Capture tenant must come from the scoped token');
assert.doesNotMatch(captureIngest, /portalSlug: body\.portalSlug/, 'Capture ingestion must not trust body portalSlug');

const captureStatus = read('app/api/capture/[id]/status/route.ts');
assert.match(captureStatus, /record\.portalSlug !== scopedSlug/, 'Capture status must enforce tenant ownership');

const pulseEvents = read('app/api/pulse/events/route.ts');
assert.match(pulseEvents, /guardAdminApi\(req\)/, 'Pulse event reads must be admin-only');


const authSession = read('lib/auth/session.ts');
assert.match(authSession, /const order = hint \? \[hint\] : REALM_PRIORITY/, 'Explicit realm hints must not probe other realms');
assert.match(authSession, /const probe: AuthRealm\[\] = hint \? \[hint\] : REALM_PRIORITY/, 'Realm-specific cookie lookup must be strict');
assert.match(authSession, /rawHeaderRealm && !headerRealm/, 'Invalid realm headers must be rejected');
assert.match(authSession, /opts\.realm !== headerRealm/, 'Conflicting realm headers must be rejected');

const organizationsRoute = read('app/api/organizations/route.ts');
assert.doesNotMatch(organizationsRoute, /session\.role \?\? 'owner'/, 'Organization listing must not synthesize owner access');

const organizationSwitch = read('app/api/organizations/switch/route.ts');
assert.match(organizationSwitch, /membership\.status !== 'active'/, 'Organization switching must require active membership');
assert.doesNotMatch(organizationSwitch, /organizationId === session\.orgId/, 'Current session state must not replace membership verification');


const portalSessionResolver = read('lib/auth/resolve-portal-session.ts');
assert.match(portalSessionResolver, /NODE_ENV !== 'production'/, 'Development compatibility must be explicit');
assert.match(portalSessionResolver, /session\.orgId && !session\.orgId\.startsWith\('org_'\)/, 'Production portal sessions must require persisted organizations');
assert.match(portalSessionResolver, /!hasRequiredOrganization\(session\)/, 'Both portal session guards must enforce organization persistence');

const portalModules = read('lib/modules/portal-modules.ts');
assert.match(portalModules, /NODE_ENV === 'production' && !isDemo/, 'Production entitlement fallback must be explicit');
assert.match(portalModules, /return new Set<ModuleId>\(\)/, 'Missing production entitlements must return no modules');


const experienceStore = read('lib/experience-builder/page-store.ts');
assert.doesNotMatch(experienceStore, /syntheticOrgId/, 'Experience Builder storage must not synthesize organization IDs');
assert.match(experienceStore, /requires a persisted organization ID/, 'Experience Builder must reject missing or synthetic organizations');
assert.match(experienceStore, /page\.organizationId === orgId/, 'Experience Builder lists must verify persisted organization ownership');

const experiencePublish = read('lib/experience-builder/publish-page.ts');
assert.match(experiencePublish, /getExperiencePage\(input\.pageId, input\.organizationId\)/, 'Experience publishing must load within the authenticated organization');
assert.match(experiencePublish, /organizationId: input\.organizationId/, 'Experience activity must use the persisted organization');

const experienceRoutes = read('app/api/portal/experience-pages/route.ts');
assert.match(experienceRoutes, /createExperiencePage\(orgId, body\.slug/, 'Experience creation must pass session organization ID');


const ctpStudio = read('lib/ctp-studio-bridge.ts');
assert.doesNotMatch(ctpStudio, /syntheticOrgId|EA_INTERNAL_ORG_ID/, 'CTP studio must not synthesize organization IDs');
assert.match(ctpStudio, /findOrganizationByPortalSlug/, 'CTP studio must resolve a persisted organization');
assert.match(ctpStudio, /organization\.status !== 'Active'/, 'CTP studio must require an active organization');
assert.match(ctpStudio, /finalizeCtpAssetManifest\(submission\.assetManifest, organizationId\)/, 'CTP assets must be copied into the persisted tenant');

const ctpAssets = read('lib/ctp-asset-store.ts');
assert.match(ctpAssets, /createHash\('sha256'\)/, 'CTP staging scope must be one-way hashed');
assert.match(ctpAssets, /'staging_ctp_' \+ digest/, 'CTP staging must be explicit and tenant-neutral');

const assessmentSubmit = read('app/api/assessment/submit/route.ts');
assert.match(assessmentSubmit, /ctpAssetStagingScope/, 'Pre-provisioning CTP uploads must use staging scope');
assert.doesNotMatch(assessmentSubmit, /resolveCtpOrganizationId\(\{ considerSlug/, 'Consider slugs must not impersonate organization IDs');


const billingPortal = read('app/api/billing/portal/route.ts');
assert.doesNotMatch(billingPortal, /syntheticOrgId/, 'Billing must not use synthetic organization IDs');
assert.match(billingPortal, /organization\.id !== session\.orgId/, 'Billing organization must match the authenticated session tenant');
assert.match(billingPortal, /membership\.status !== 'active'/, 'Billing must require active membership');
assert.match(billingPortal, /can\(membership\.role, 'billing:manage'\)/, 'Billing must enforce billing RBAC from persisted membership');
assert.match(billingPortal, /customer: organization\.stripeCustomerId/, 'Stripe customer must come from the verified organization');

const auditRunner = read('scripts/run-tenant-data-audit.ps1');
assert.match(auditRunner, /Read-Host .* -AsSecureString/, 'Audit runner must collect the token without echoing');
assert.match(auditRunner, /ZeroFreeBSTR/, 'Audit runner must zero the unmanaged token buffer');
assert.doesNotMatch(auditRunner, /\[(?:string|securestring)\]\s*\$\w*Token/i, 'Audit runner must not accept a token command-line parameter');
assert.match(auditRunner, /TENANT_AUDIT_FIXTURE = ''/, 'Live runner must disable fixture mode');

console.log('Tenant safety checks passed.');
