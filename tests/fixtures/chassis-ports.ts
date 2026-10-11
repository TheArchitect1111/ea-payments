export const db = { records: new Map<string, any>(), entitlements: [] as any[], writes: [] as string[], durable: true, dropped: false, confirmations: 0, session: null as any, member: true, payment: null as any };
(globalThis as any).__chassisTest = db;
export const mocks: Record<string, string> = {
  '@/lib/creative-studio/persistence': `
    const db=()=>globalThis.__chassisTest;
    export async function saveStudioRecord(row){db().writes.push(row.id); if(db().durable)db().records.set(row.recordType+':'+row.id,structuredClone(row.payload));return {ok:true,persistedToAirtable:db().durable};}
    export async function loadStudioRecordFromAirtable(type,id){return structuredClone(db().records.get(type+':'+id)??null);}
    export const loadStudioRecord=loadStudioRecordFromAirtable;
  `,
  '@/lib/entitlements': `
    const db=()=>globalThis.__chassisTest;
    export async function listEntitlementsForOrg(org){return db().entitlements.filter(e=>e.organizationId===org);}
    export function activeModuleIdsFromEntitlements(rows){return new Set(rows.filter(e=>e.status==='active'||e.status==='trial').map(e=>e.moduleId));}
    export async function setModuleEnabled(org,moduleId,enabled,source){const e={organizationId:org,moduleId,status:enabled?'active':'suspended',source};globalThis.__chassisTest.entitlements=globalThis.__chassisTest.entitlements.filter(x=>x.organizationId!==org||x.moduleId!==moduleId);globalThis.__chassisTest.entitlements.push(e);globalThis.__chassisTest.writes.push('entitlement');return e;}
    export async function setModulesEnabledBulk(org,ids,enabled,source){for(const id of ids)await setModuleEnabled(org,id,enabled,source);return {ok:ids,failed:[]};}
    export async function syncPackageEntitlements(org,ids){db().writes.push('entitlements');if(db().dropped)return;db().entitlements=db().entitlements.filter(e=>e.organizationId!==org||e.source!=='package');for(const id of ids)db().entitlements.push({organizationId:org,moduleId:id,status:'active',source:'package'});}
  `,
  '@/lib/organizations': `
    export async function ensureOrganizationForPortal(){globalThis.__chassisTest.writes.push('org');return {orgId:'recTENANT1'};}
    export async function findOrganizationByPortalSlug(slug){return {id:'recTENANT1',portalSlug:slug,status:'Active'};}
    export async function updateOrganizationWorkspaceConfig(org,config){globalThis.__chassisTest.records.set('brand:org-workspace-'+org,structuredClone(config));return config;}
  `,
  '@/lib/admin-session-guard': `export async function requireAdminActionFromRequest(){return {ok:true};}export async function requireAdminSessionFromRequest(){return {ok:true};}export function adminAuthJsonError(){return Response.json({error:'Denied'},{status:403});}`,
  '@/lib/platform-store': `export function platformStoreConfigured(){return true;}`,
  '@/lib/tenant-context': `export function isSyntheticOrganizationId(org){return org.startsWith('org_');}`,
  '@/lib/api/portal-route': `export async function guardPortalApi(req,{slug}){const session=globalThis.__chassisTest.session;return session&&session.slug===slug?{ok:true,session}:{ok:false,status:401,error:'Authentication required'};}export function portalApiUnauthorized(f){return Response.json({error:f.error},{status:f.status});}`,
  '@/lib/memberships': `export async function findMembership(){return globalThis.__chassisTest.member?{status:'active',role:'viewer'}:null;}`,
  '@/lib/stripe': `export function getStripe(){return {paymentIntents:{retrieve:async()=>globalThis.__chassisTest.payment},checkout:{sessions:{create:async()=>({id:'cs_test',url:'https://checkout.stripe.com/test'})}}};}`,
  '@/lib/ea-auth-email': `export async function sendAuthEmail(){globalThis.__chassisTest.confirmations++;return {ok:true};}`,
  'server-only': '',
  '@/lib/os-capability-taxonomy': 'export function listOsCapabilitiesByLifecycle(){return [];}',
};
