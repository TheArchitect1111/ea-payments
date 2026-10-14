import { sourceAdapter } from './sourceAdapter';
import { amandaTrialExpired, resolveAmandaEntitlement } from '../../../lib/amanda-catherine/test-access-rules';
export const entitlementAdapter=sourceAdapter({id:'entitlement',files:[{path:'lib/amanda-catherine/test-access-rules.ts',contains:'amandaTrialExpired'}],verify:async()=>{
const now=Date.now();
const expired={isTestAccess:true,testPaidAt:new Date(now-80*3600000).toISOString(),expiresAt:new Date(now-8*3600000).toISOString()};
const active={isTestAccess:true,testPaidAt:new Date(now-3600000).toISOString(),expiresAt:new Date(now+71*3600000).toISOString()};
const permanent={isTestAccess:false,testPaidAt:null,expiresAt:null};
const passed=amandaTrialExpired(expired,now)&&!amandaTrialExpired(active,now)&&amandaTrialExpired({...active,expiresAt:'invalid'},now)&&resolveAmandaEntitlement(permanent,active)===permanent;
return {status:passed?200:503,evidence:passed?'72-hour trial expiration, invalid-expiry denial and permanent preservation verified':'Entitlement invariant failed'};
}});
