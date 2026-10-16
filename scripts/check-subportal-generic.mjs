/** Static barrier against tenant-specific code in the Subportal Brick itself. */
import {readFileSync,readdirSync,existsSync} from 'node:fs';
import {join} from 'node:path';
const roots=[
  'lib/subportal','src/chassis/adapters/subportal.adapter.ts',
  'app/api/subportal','app/api/webhooks/subportal',
  'app/portal/[slug]/students','app/portal/subportal-auth',
];
const forbidden=/\b(?:amanda|tarris|tb3|amanda-catherine|amandacatherine)\b/i;
const violations=[];
function scan(path){
  if(!existsSync(path))return violations.push('Missing Subportal path: '+path);
  const stat=readdirSync;
  if(!/\.(ts|tsx)$/.test(path)){
    for(const child of stat(path,{withFileTypes:true}))scan(join(path,child.name));
    return;
  }
  const content=readFileSync(path,'utf8');
  if(forbidden.test(content))violations.push('Client-specific identifier found in '+path);
}
for(const root of roots)scan(root);
if(violations.length){
  console.error(violations.join('\n'));
  process.exit(1);
}
console.log('PASS: No client-specific names or known client slugs in Subportal Brick.');
