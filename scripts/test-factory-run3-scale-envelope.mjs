import { runFactoryTortureCertification } from '../lib/factory-torture-harness.mjs';

const TENANTS = 50;
const PRODUCTS_PER_TENANT = 5;
const result = await runFactoryTortureCertification({ tenantCount: TENANTS });

if (result.status !== 'PASS') throw new Error('Run 3 scale certification did not pass');
if (result.tenantCount !== TENANTS) throw new Error(`Expected ${TENANTS} tenants, got ${result.tenantCount}`);
if (result.jobsAttempted !== TENANTS * PRODUCTS_PER_TENANT) throw new Error(`Expected ${TENANTS * PRODUCTS_PER_TENANT} jobs, got ${result.jobsAttempted}`);
if (result.jobsPermanentlyFailed !== 1) throw new Error('Run 3 expected exactly one isolated permanent failure');
if (result.retryableFailuresRecovered < 1) throw new Error('Run 3 expected injected retryable failure to recover');
if (result.artifactIdsUnique !== true) throw new Error('Run 3 artifact IDs were not unique');
if (result.tenantIsolation !== 'PASS') throw new Error('Run 3 tenant isolation failed');
if (result.idempotentAppend !== 'PASS') throw new Error('Run 3 idempotency failed');
if (result.failClosedDelivery !== 'PASS') throw new Error('Run 3 delivery did not remain fail-closed');
if (result.externalProductionTouched !== false) throw new Error('Run 3 touched external production data');

console.log(JSON.stringify({ ...result, certification: 'FACTORY_RUN_3_SCALE_ENVELOPE', certifiedTenants: TENANTS, certifiedWorkOrders: TENANTS * PRODUCTS_PER_TENANT }, null, 2));
