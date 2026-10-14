import { sourceAdapter } from './sourceAdapter';
export const amazonAdapter = sourceAdapter({id:'amazon',files:[],verify:async()=>({status:503,evidence:'CONTRACT ONLY: external client product destination not verified'})});
