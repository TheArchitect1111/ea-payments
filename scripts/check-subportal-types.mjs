/**
 * Runs the real project TypeScript compiler. Blocks only errors in changed Subportal files.
 * Other project diagnostics are surfaced, not concealed or treated as a global PASS.
 */
import {spawnSync} from 'node:child_process';
const result=spawnSync(process.platform==='win32'?'npx.cmd':'npx',
  ['tsc','--noEmit','--incremental','false','--pretty','false'],
  {encoding:'utf8',maxBuffer:24*1024*1024});
const out=(result.stdout||'')+'\n'+(result.stderr||'');
const errors=out.split(/\r?\n/).filter(line=>/error TS\d+:/.test(line));
const owned=/^(?:lib\/subportal\/|app\/portal\/\[slug\]\/students\/|app\/portal\/subportal-auth\/|app\/api\/subportal\/|app\/api\/webhooks\/subportal\/|src\/chassis\/adapters\/subportal\.adapter\.ts|middleware\.ts\()/;
const changed=errors.filter(line=>owned.test(line) ||
  (/^app\/api\/webhooks\/stripe\/route\.ts\((?:1[0-9]|2[0-1][0-9]),/.test(line)));
console.log('TypeScript diagnostics across the repository:',errors.length);
console.log('Subportal owned and changed-webhook errors:',changed.length);
if(changed.length) console.error(changed.join('\n'));
if(result.error || (result.status!==0 && errors.length===0)){
  console.error(result.error||out.slice(-4000));
  process.exit(1);
}
if(changed.length)process.exit(1);
if(errors.length)console.warn('Existing repository-wide TypeScript failures remain; this is NOT global type certification.');
else console.log('Global TypeScript check passed.');
