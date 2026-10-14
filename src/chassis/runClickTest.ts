import { clickTest } from './clickTest';
import type { Brick } from './BrickInterface';

/** The chassis must explicitly register adapters. An empty registry is NOT success. */
const registeredBricks: Brick[] = [];
const result = await clickTest(registeredBricks, 'test', 'stripe-test');
console.log(JSON.stringify({ ...result, evidence: 'Not certified until 14 real adapters are registered and exercised' }, null, 2));
if (!result.passed) process.exitCode = 1;
