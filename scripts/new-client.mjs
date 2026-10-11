#!/usr/bin/env node
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {tsImport} from 'tsx/esm/api';
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..');
process.chdir(root);
const args=process.argv.slice(2);
if(args.length!==1 || !args[0].trim()) {
 console.error('Usage: node scripts/new-client.mjs "Client Name"'); process.exit(1);
}
const name=args[0].trim();
const slug=name.normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-|-$/g,'');
const git=(...args)=>execFileSync('git',args,{cwd:root,encoding:'utf8'}).trim();
try {
 if(!slug || slug.length>80) throw new Error('Client name must produce a slug of 1-80 characters');
 if(git('status','--porcelain')) throw new Error('Commit or stash repository changes before onboarding');
 const branchName=`client/${slug}`;
 // git refuses duplicate branches; no existing branch or client can be overwritten.
 git('checkout','-b',branchName);
 try {
  const {createClientBrick}=await tsImport('../lib/services/brickRegistrar.ts',import.meta.url);
  const result=await createClientBrick(name,slug);
  execFileSync(process.execPath,['scripts/guard-brick-chassis.mjs'],{cwd:root,stdio:'inherit'});
  console.log(JSON.stringify({...result,filesUpdated:['lib/clients/registry.json'],state:'scaffolded; certify and review before publishing'},null,2));
 } catch(error) {
  // Keep failed work visible for diagnosis. Never publish or conceal a guard failure.
  throw new Error(`Onboarding failed on ${branchName}: ${error.message}`);
 }
} catch(error) {console.error(error.message);process.exit(1);}
