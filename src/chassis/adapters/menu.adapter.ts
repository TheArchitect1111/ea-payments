import { sourceAdapter } from './sourceAdapter';
export const menuAdapter = sourceAdapter({id:'menu',files:[],verify:async()=>({status:503,evidence:'CONTRACT ONLY: client menu and purchase routing have not been verified'})});
