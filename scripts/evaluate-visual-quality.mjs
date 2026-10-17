import fs from 'node:fs/promises';
import path from 'node:path';
const dir=process.env.VISUAL_CAPTURE_DIR||'docs/baseline-screenshots';
const files=(await fs.readdir(dir)).filter(f=>f.startsWith('after-')&&f.endsWith('.png'));
const results=[];
for(const file of files){
 const bytes=await fs.readFile(path.join(dir,file));
 const png={width:bytes.readUInt32BE(16),height:bytes.readUInt32BE(20)};
 const pixels=png.width*png.height;
 if(bytes.subarray(0,8).toString('hex')!=='89504e470d0a1a0a') throw new Error('Invalid PNG: '+file);
 const conditions=[];
 const fullPage=/after-(home|portal)-/.test(file);
 if(fullPage&&png.width<320) conditions.push('full-page-too-narrow');
 if(fullPage&&png.height<500) conditions.push('full-page-too-short');
 if(png.width<80||png.height<45||pixels<12000) conditions.push('capture-too-small');
 results.push({file,width:png.width,height:png.height,passed:conditions.length===0,issues:conditions});
}
const report={schemaVersion:1,method:'deterministic-screenshot-inspection',evaluator:'node-png-header',scope:'Amanda preview only',visualCritic:{status:'not-executed',reason:'Vision-model invocation is not wired or verified in GitHub Actions'},premiumGate:{status:'not-scored',reason:'An 8.5/10 score requires real model observations, not invented ratings'},results};
await fs.mkdir('artifacts/visual-quality',{recursive:true});
await fs.writeFile('artifacts/visual-quality/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({screenshots:results.length,failures:results.filter(r=>!r.passed),visualCritic:report.visualCritic.status}));
if(results.length<10||results.some(r=>!r.passed))process.exitCode=1;
