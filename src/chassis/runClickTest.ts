import { clickTest } from './clickTest';
import type { Brick, BrickHealth } from './BrickInterface';
import type { CatalogSource } from './adapters/catalog.adapter';
import { authAdapter } from './adapters/auth.adapter';
import { lmsAdapter } from './adapters/lms.adapter';
import { createBillingAdapter } from './adapters/billing.adapter';
import { createCatalogAdapter } from './adapters/catalog.adapter';
import { menuAdapter } from './adapters/menu.adapter';
import { checkoutAdapter } from './adapters/checkout.adapter';
import { welcomeAdapter } from './adapters/welcome.adapter';
import { emailAdapter } from './adapters/email.adapter';
import { entitlementAdapter } from './adapters/entitlement.adapter';
import { createJaneAdapter } from './adapters/jane.adapter';
import { amazonAdapter } from './adapters/amazon.adapter';
import { previewAdapter } from './adapters/preview.adapter';
import { productionGateAdapter } from './adapters/production-gate.adapter';
import { chassisCertAdapter } from './adapters/chassis-cert.adapter';

export interface ClientConfig {
  id: string;
  prices: Record<string, number>;
  catalogSource: CatalogSource;
  janeUrl: string;
  janeApiKey?: string;
}
export async function runClickTest(clientConfig: ClientConfig) {
  if (!clientConfig.id || !/^[a-z0-9-]+$/.test(clientConfig.id)) throw Error('Valid client ID required');
  const courseId = Object.keys(clientConfig.prices)[0];
  if (!courseId || !Number.isSafeInteger(clientConfig.prices[courseId]) ||
      clientConfig.prices[courseId] <= 0) throw Error('Positive client price contract required');
  const bricks: Brick[] = [
    authAdapter, lmsAdapter, createBillingAdapter(clientConfig.prices),
    createCatalogAdapter(clientConfig.catalogSource), menuAdapter,
    checkoutAdapter, welcomeAdapter, emailAdapter, entitlementAdapter,
    createJaneAdapter(clientConfig), amazonAdapter, previewAdapter,
    productionGateAdapter, chassisCertAdapter,
  ];
  const result = await clickTest(bricks, courseId, 'stripe-test');
  return { ...result, clientId: clientConfig.id };
}

/** CLI: npx tsx src/chassis/runClickTest.ts --client=<client-id> */
const clientArg = process.argv.find(arg => arg.startsWith('--client='));
if (!clientArg) {
  console.error('Client config required: --client=<client-id>');
  process.exitCode = 1;
} else {
  const clientId = clientArg.slice('--client='.length);
  if (!/^[a-z0-9-]+$/.test(clientId)) throw Error('Invalid client identifier');
  const configModule = await import('../clients/' + clientId + '/chassis.config');
  const result = await runClickTest(configModule.clientConfig as ClientConfig);
  console.log(JSON.stringify(result, null, 2));
  if (result.passed) console.log('14/14 CLICK PASS: ' + clientId);
  else process.exitCode = 1;
}
