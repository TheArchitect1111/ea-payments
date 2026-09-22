const PUBLIC_MODULE_RUNTIME = {
  eshop: { section: 'store', actions: ['browse-products','checkout'], bindings: ['payments','orders'] },
  events: { section: 'events', actions: ['browse-events','register'], bindings: ['calendar','payments','notifications'] },
  appointments: { section: 'appointments', actions: ['view-availability','book'], bindings: ['calendar','payments','notifications'] },
  'courses-lms': { section: 'learning', actions: ['browse-courses','enroll'], bindings: ['identity-auth','payments'] },
  documents: { section: 'resources', actions: ['open-public-resource'], bindings: ['files'] },
  messages: { section: 'contact', actions: ['start-conversation'], bindings: ['messaging','notifications'] },
  community: { section: 'community', actions: ['view-community'], bindings: ['identity-auth'] },
  donations: { section: 'donations', actions: ['donate'], bindings: ['payments','crm'] },
  'crm-clients': { section: 'contact', actions: ['submit-lead'], bindings: ['crm'] },
  media: { section: 'media', actions: ['view-media'], bindings: ['files'] },
  calendar: { section: 'calendar', actions: ['view-calendar'], bindings: ['calendar'] },
  eva: { section: 'assistant', actions: ['open-assistant'], bindings: ['messaging'] }
};

function assert(value, message) { if (!value) throw new Error(message); }

export function materializeWebsiteRuntime(workOrder = {}) {
  assert(workOrder.type === 'website', 'website work order required');
  const payload = workOrder.payload || {};
  const modules = payload.modules || [];
  const navigation = payload.navigation || [];
  const routes = payload.routes || {};
  const ctaBindings = payload.ctaBindings || {};
  const permissions = payload.permissions || {};
  const dataBindings = payload.dataBindings || {};
  const sections = modules.map((moduleId) => {
    const runtime = PUBLIC_MODULE_RUNTIME[moduleId];
    assert(runtime, `website runtime missing for ${moduleId}`);
    const nav = navigation.find((n) => n.moduleId === moduleId);
    assert(nav, `navigation missing for ${moduleId}`);
    assert(routes[moduleId] === nav.route, `route mismatch for ${moduleId}`);
    assert(ctaBindings[moduleId], `cta binding missing for ${moduleId}`);
    return { moduleId, label: nav.label, route: nav.route, section: runtime.section, actions: runtime.actions, bindings: runtime.bindings, permissions: permissions[moduleId], dataBindings: dataBindings[moduleId] };
  });
  return {
    kind: 'website_app', builderId: 'website-assembly-line', tenantId: workOrder.tenantId,
    projectId: workOrder.projectId, workOrderId: workOrder.id,
    navigation: navigation.filter((n) => modules.includes(n.moduleId)), sections, routes, ctaBindings,
    workflows: payload.workflows || [], integrations: payload.integrations || [], brandKit: payload.brandKit || null,
    content: payload.content || null, designReference: payload.designReference || null, stub: false, assemblyLine: true
  };
}

export const websiteModuleRuntimeCatalog = Object.freeze(PUBLIC_MODULE_RUNTIME);
