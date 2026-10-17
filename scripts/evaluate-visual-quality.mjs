import fs from 'node:fs/promises';
import path from 'node:path';
import { PNG } from 'pngjs';
const dir=process.env.VISUAL_CAPTURE_DIR||'docs/baseline-screenshots';
const files=(await fs.readdir(dir)).filter(f=>f.startsWith('after-')&&f.endsWith('.png'));
const results=[];
for(const file of files){
 const bytes=await fs.readFile(path.join(dir,file));
 const png=PNG.sync.read(bytes);
 const pixels=png.width*png.height;
 const conditions=[];
 if(png.width<320) conditions.push('too-narrow');
 if(png.height<200) conditions.push('too-short');
 if(pixels<100000) conditions.push('insufficient-resolution');
 let dark=0,bright=0;
 for(let i=0;i<png.data.length;i+=4*23){
  const y=.2126*png.data[i]+.7152*png.data[i+1]+.0722*png.data[i+2];
  if(y<20)dark++;if(y>245)bright++;
 }
 const sample=Math.ceil(pixels/23);
 if(dark/sample>.98||bright/sample>.98)conditions.push('mostly-solid-image');
 results.push({file,width:png.width,height:png.height,passed:conditions.length===0,issues:conditions});
}
const report={schemaVersion:1,method:'deterministic-screenshot-inspection',evaluator:'pngjs',scope:'Amanda preview only',visualCritic:{status:'not-executed',reason:'Vision-model invocation is not wired or verified in GitHub Actions'},premiumGate:{status:'not-scored',reason:'An 8.5/10 score requires real model observations, not invented ratings'},results};
await fs.mkdir('artifacts/visual-quality',{recursive:true});
await fs.writeFile('artifacts/visual-quality/report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({screenshots:results.length,failures:results.filter(r=>!r.passed),visualCritic:report.visualCritic.status}));
if(results.length<10||results.some(r=>!r.passed))process.exitCode=1;
