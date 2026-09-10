import { copy, get, list } from '@vercel/blob';

const targets = [
  { key: 'reset-training-manual', pathname: 'AesthetiKine 1-Day Nervous System Reset Manual.pdf', terms: ['aesthetikine','reset','manual'], alternates: ['nervous','system','training'] },
  { key: 'body-sculpt-certification-overview', pathname: 'AesthetiKine_Body_Sculpt_Certification_Overview.pdf', terms: ['aesthetikine','body','sculpt'], alternates: ['certification','overview'] },
];
const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g,' ').trim();
async function exists(pathname) {
  try { const result = await get(pathname,{access:'private'}); return Boolean(result && result.statusCode === 200); } catch { return false; }
}
const all=[]; let cursor;
do { const page=await list({cursor,limit:1000}); all.push(...page.blobs); cursor=page.cursor; } while(cursor);
console.log(`[Amanda Blob Repair] inspected ${all.length} private blobs`);
let complete=true;
for (const target of targets) {
  if (await exists(target.pathname)) { console.log(`[Amanda Blob Repair] ${target.key}: already present`); continue; }
  const targetNorm=normalize(target.pathname);
  const ranked=all.map(blob=>{ const norm=normalize(blob.pathname); let score=0; if(norm===targetNorm)score+=100; for(const term of target.terms)if(norm.includes(term))score+=10; for(const term of target.alternates)if(norm.includes(term))score+=4; if(norm.endsWith('pdf'))score+=2; return {blob,score}; }).filter(x=>x.score>=22).sort((a,b)=>b.score-a.score);
  const candidate=ranked[0]?.blob;
  if(!candidate){ console.log(`[Amanda Blob Repair] ${target.key}: no candidate found`); complete=false; continue; }
  try { await copy(candidate.url,target.pathname,{access:'private',allowOverwrite:false,contentType:'application/pdf'}); const ok=await exists(target.pathname); console.log(`[Amanda Blob Repair] ${target.key}: ${ok?'repaired':'copy verification failed'}`); if(!ok) complete=false; } catch(error){ console.log(`[Amanda Blob Repair] ${target.key}: copy failed ${error instanceof Error ? error.message : 'unknown error'}`); complete=false; }
}
console.log(`[Amanda Blob Repair] complete=${complete}`);
