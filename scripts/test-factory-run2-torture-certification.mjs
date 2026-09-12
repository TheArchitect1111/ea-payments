import { runFactoryTortureCertification } from '../lib/factory-torture-harness.mjs';
const result = await runFactoryTortureCertification({ tenantCount: 12 });
if (result.status !== 'PASS') throw new Error('Run 2 certification did not pass');
if (result.jobsAttempted !== 60) throw new Error(`Expected 60 jobs, got ${result.jobsAttempted}`);
if (result.jobsPermanentlyFailed !== 1) throw new Error('Expected exactly one isolated permanent failure');
if (result.retryableFailuresRecovered < 1) throw new Error('Expected injected retryable failure to recover');
if (result.externalProductionTouched !== false) throw new Error('Torture test touched production');
console.log(JSON.stringify(result, null, 2));