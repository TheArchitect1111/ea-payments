#!/usr/bin/env node
/**
 * Chassis source policy. Any client brick calling trackingPortal directly or
 * writing tracking/registration metadata to Airtable bypasses the registrar.
 * Existing business-domain persistence is allowed; tracking persistence is not.
 */
import { readFileSync,readdirSync,statSync } from 'node:fs';
import { join,relative } from 'node:path';
const root=process.cwd();
const inputs=['app/api','app/tarris','lib/tb3','lib/amanda-catherine','lib/bricks','lib/services'];
const exclude=new Set(['lib/services/trackingPortal.ts','lib/services/brickRegistrar.ts']);
const exceptions=new Set([
  // Explicitly reviewed legacy non-brick integrations; none currently allowed.
]);
function candidates(dir){
 let out=[];
 for(const entry of readdirSync(join(root,dir),{withFileTypes:true})){
  const path=join(dir,entry.name);
  if(entry.isDirectory())out.push(...candidates(path));
  else if(/\.(ts|tsx|js|mjs)$/.test(path)&&!exclude.has(path)&&!exceptions.has(path))out.push(path);
 }
 return out;
}
export function violations(path,source){
 const results=[];
 const direct=/\b(?:pushToTrackingPortal|confirmTrackingPayment|enqueueTrackingPortalRetry|getTestTrackingRegistration)\s*\(|(?:from\s*['"][^'"]*\/services\/trackingPortal(?:\.ts)?['"]|import\s*\([^)]*trackingPortal)/g;
 if(direct.test(source))results.push('direct trackingPortal call/import');
 // Detect registration/tracking-specific writes, not domain-owned business data.
 const forbidden=/(?:airtableUpsertByField|airtableCreate|airtableUpdate|saveStudioRecord|writeBrickRecord)\s*\((?:[^)]|\n){0,250}?(?:tracking[_ -]?registration|tracking[_ -]?portal|tracking[_ -]?payment)/gi;
 if(forbidden.test(source))results.push('direct Airtable tracking registration write');
 return results.map(reason=>path+': '+reason);
}
if(process.argv.includes('--self-test')){
 const sample='import { pushToTrackingPortal } from "@/lib/services/trackingPortal"; pushToTrackingPortal(x)';
 const bad=violations('client/new-brick.ts',sample);
 if(bad.length===0)throw Error('Guard failed to reject direct tracking');
 if(violations('client/new-brick.ts',"registerBrickEvent(value)").length)
  throw Error('Guard rejected canonical registrar');
 console.log('PASS: illegal direct tracking rejected; canonical registrar accepted');
}else{
 const all=inputs.flatMap(candidates).flatMap(p=>violations(p,readFileSync(join(root,p),'utf8')));
 if(all.length){console.error('Chassis auto-wire policy violations:\n'+all.join('\n'));process.exit(1);}
 console.log('PASS: no direct tracking bypass in brick and client paths');
}
