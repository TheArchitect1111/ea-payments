const MODULE_RUNTIME = {
  eshop: { surface: 'catalog', actions: ['browse-products','checkout','view-orders'], bindings: ['payments','orders'] },
  events: { surface: 'events', actions: ['browse-events','register','view-registration'], bindings: ['calendar','payments','notifications'] },
  appointments: { surface: 'appointments', actions: ['view-availability','book','view-booking'], bindings: ['calendar','payments','notifications'] },
  'courses-lms': { surface: 'learning', actions: ['browse-courses','enroll','resume-learning'], bindings: ['identity-auth','progress-tracking','payments'] },
  documents: { surface: 'documents', actions: ['list-files','open-file','upload-file'], bindings: ['files','roles-permissions'] },
  messages: { surface: 'messages', actions: ['list-conversations','send-message'], bindings: ['messaging','notifications'] },
  community: { surface: 'community', actions: ['view-feed','post','reply'], bindings: ['identity-auth','messaging','notifications'] },
  donations: { surface: 'donations', actions: ['donate','view-receipt'], bindings: ['payments','crm','reporting'] },
  'crm-clients': { surface: 'clients', actions: ['list-clients','view-client','update-client'], bindings: ['tenant-data','workflow','analytics'] }
};

function assert(value, message) { if (!value) throw new Error(message); }

export function materializePortalRuntime(workOrder = {}) {
  assert(workOrder.type === 'portal', 'portal work order required');
  const payload = workOrder.payload || {};
  const modules = payload.modules || [];
  const navigation = payload.navigation || [];
  const routes = payload.routes || {};
  const ctaBindings = payload.ctaBindings || {};
  const permissions = payload.permissions || {};
  const dataBindings = payload.dataBindings || {};

  const surfaces = modules.map((moduleId) => {
    const runtime = MODULE_RUNTIME[moduleId];
    assert(runtime, `portal runtime missing for ${moduleId}`);
    const nav = navigation.find((n) => n.moduleId === moduleId);
    assert(nav, `navigation missing for ${moduleId}`);
    assert(routes[moduleId] === nav.route, `route mismatch for ${moduleId}`);
    assert(ctaBindings[moduleId], `cta binding missing for ${moduleId}`);
    assert(permissions[moduleId], `permissions missing for ${moduleId}`);
    assert(dataBindings[moduleId], `data binding missing for ${moduleId}`);
    return {
      moduleId,
      label: nav.label,
      route: nav.route,
      surface: runtime.surface,
      actions: runtime.actions,
      bindings: runtime.bindings,
      permissions: permissions[moduleId],
      dataBindings: dataBindings[moduleId]
    };
  });

  return {
    kind: 'portal_app',
    builderId: 'portal-assembly-line',
    tenantId: workOrder.tenantId,
    projectId: workOrder.projectId,
    workOrderId: workOrder.id,
    navigation: navigation.filter((n) => modules.includes(n.moduleId)),
    surfaces,
    routes,
    ctaBindings,
    workflows: payload.workflows || [],
    integrations: payload.integrations || [],
    brandKit: payload.brandKit || null,
    content: payload.content || null,
    designReference: payload.designReference || null,
    stub: false,
    assemblyLine: true
  };
}

export const portalModuleRuntimeCatalog = Object.freeze(MODULE_RUNTIME);
