import { sourceAdapter } from './sourceAdapter';
export function createEmailAdapter() {
 return sourceAdapter({id:'email',files:[],verify:async()=>({status:503,evidence:'CONTRACT ONLY: email provider integration not verified'})});
}
export const emailAdapter = createEmailAdapter();
