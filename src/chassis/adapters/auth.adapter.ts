import { sourceAdapter } from './sourceAdapter';
export const authAdapter = sourceAdapter({id:'auth',files:[{path:'lib/api/portal-route.ts',contains:'guardPortalApi'}]});
