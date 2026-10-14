import { sourceAdapter } from './sourceAdapter';
import type { BrickHealth } from '../BrickInterface';
export function createCatalogAdapter(runtimeCheck:()=>Promise<BrickHealth>){return sourceAdapter({id:'catalog',files:[{path:'lib/amanda-catherine/registry.ts',contains:'Creative Studio'}],verify:runtimeCheck});}
export const catalogAdapter=createCatalogAdapter(async()=>({status:503,evidence:'No client catalog connected'}));
