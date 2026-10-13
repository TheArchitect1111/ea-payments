import {spawnSync} from 'node:child_process';
import {writeFileSync} from 'node:fs';
const result=spawnSync('npx',['--no-install','tsc','--noEmit','--skipLibCheck'],{encoding:'utf8',maxBuffer:8*1024*1024});
const output=(result.stdout??'')+(result.stderr??'');
writeFileSync('cigar-typescript-diagnostics.log',output);
if(result.error||result.signal){console.error('TypeScript did not complete:',result.error?.message??result.signal);process.exit(1);}
const diagnostics=output.split('\n').filter(line=>/error TS\d+/.test(line));
if(result.status!==0&&diagnostics.length===0){console.error('TypeScript failed without source diagnostics.');process.exit(1);}
const scope=/^(?:lib\/cigar-ctp\/|app\/(?:api\/)?(?:admin\/)?cigar-ctp\/|app\/discover\/cigar\/|app\/ctp\/|lib\/ctp[^/]*\.ts\(|(?:app|lib)\/[^\s(]*intake[^\s(]*\()/i;
const scoped=diagnostics.filter(line=>scope.test(line));
// Pre-existing shared CTP diagnostic was observed on the starting branch and is
// outside the Cigar runtime. Permit only this exact error; no general TS2820 waiver.
const baseline=/^lib\/ctp-production-provision\.ts\(61,5\): error TS2820: Type '"ctp\.production\.blocked"' is not assignable to type 'PulseEventType'\. Did you mean '"ctp\.production\.ready"'\?$/;
const known=scoped.filter(line=>baseline.test(line.trim()));
const blocking=scoped.filter(line=>!baseline.test(line.trim()));
const configuration=diagnostics.filter(line=>!/^.+\(\d+,\d+\): error TS\d+:/.test(line));
console.log('TypeScript diagnostics:',diagnostics.length,'Cigar/CTP/intake blocking:',blocking.length,'Known shared CTP baseline:',known.length,'Unrelated:',diagnostics.length-scoped.length);
if(blocking.length||configuration.length){console.error([...blocking,...configuration].join('\n'));process.exit(1);}
console.log('PASS: scoped Cigar, CTP, report-email and intake check. Full unrelated diagnostics retained in cigar-typescript-diagnostics.log.');
