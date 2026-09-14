import { Worker } from '@temporalio/worker';
import * as activities from './activities.js';

async function run() {
  const worker = await Worker.create({
    workflowsPath: new URL('./workflows.ts', import.meta.url).pathname,
    activities,
    taskQueue: process.env.EA_TEMPORAL_TASK_QUEUE ?? 'ea-execution-controller',
    namespace: process.env.TEMPORAL_NAMESPACE ?? 'default',
  });
  await worker.run();
}
run().catch((error) => { console.error(error); process.exit(1); });
