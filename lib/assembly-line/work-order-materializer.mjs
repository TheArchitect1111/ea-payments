import { materializeWebsiteRuntime } from './website-module-runtime.mjs';
import { materializePortalRuntime } from './portal-module-runtime.mjs';

function assert(value, message) { if (!value) throw new Error(message); }

export function materializeAssemblyPlan(plan = {}) {
  assert(plan.kind === 'AssemblyPlan', 'AssemblyPlan required');
  assert(plan.readyForFactoryDispatch === true, 'plan must be dispatchable');
  const artifacts = (plan.workOrders || []).map((workOrder) => {
    if (workOrder.type === 'website') return materializeWebsiteRuntime(workOrder);
    if (workOrder.type === 'portal') return materializePortalRuntime(workOrder);
    throw new Error(`unsupported work order type ${workOrder.type}`);
  });
  const website = artifacts.find((a) => a.kind === 'website_app');
  const portal = artifacts.find((a) => a.kind === 'portal_app');
  assert(website || portal, 'no runtime artifacts materialized');
  return {
    kind: 'MaterializedAssembly', tenantId: plan.tenantId, projectId: plan.projectId,
    artifacts, website: website || null, portal: portal || null,
    status: 'READY_FOR_ROUTE_RENDER',
    acceptanceProbes: plan.acceptanceProbes || [], unresolvedBindings: []
  };
}
