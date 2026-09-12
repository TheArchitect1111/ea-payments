import { createStructuredBuilder } from './structured-builder.mjs';

export const portalBuilder = createStructuredBuilder({
  id: 'portal',
  workOrderType: 'portal',
  artifactKind: 'portal_app',
  deliverableType: 'portal',
  planningKinds: ['portal_blueprint', 'information_architecture', 'creative_direction'],
  gateId: 'portal-structure',
  title: 'PortalBuilder',
});
