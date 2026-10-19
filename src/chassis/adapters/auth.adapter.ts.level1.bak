import { sourceAdapter } from './sourceAdapter';
export const authAdapter = sourceAdapter({ id:'auth', files:[{path:'lib/api/portal-route.ts',contains:'guardPortalApi'}], verify: async()=>({status:503,evidence:'CONTRACT ONLY: auth source guard present; authenticated request not verified'}) });
