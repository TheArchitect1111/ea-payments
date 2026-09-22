const MODULES = {
  eshop: { capabilities: ['products','checkout','payments','orders','notifications'], route: '/shop', label: 'Shop' },
  events: { capabilities: ['content','forms','calendar','payments','notifications'], route: '/events', label: 'Events' },
  appointments: { capabilities: ['booking','calendar','payments','notifications'], route: '/appointments', label: 'Appointments' },
  'courses-lms': { capabilities: ['identity-auth','content','files','progress-tracking','payments','notifications'], route: '/learning', label: 'Learning' },
  documents: { capabilities: ['files','search','roles-permissions'], route: '/documents', label: 'Documents' },
  messages: { capabilities: ['messaging','notifications','identity-auth'], route: '/messages', label: 'Messages' },
  community: { capabilities: ['identity-auth','roles-permissions','content','messaging','notifications'], route: '/community', label: 'Community' },
  donations: { capabilities: ['forms','payments','crm','notifications','reporting'], route: '/donate', label: 'Donations' },
  'crm-clients': { capabilities: ['tenant-data','forms','search','messaging','workflow','analytics'], route: '/clients', label: 'Clients' }
};

const PRODUCT_SET = new Set(['website','portal','website+portal']);

function unique(values) { return [...new Set(values)]; }
function assert(condition, message) { if (!condition) throw new Error(message); }

export function compileBlueprint(input = {}) {
  const { tenantId, projectId, clientIdentity, selectedProducts, selectedModules = [], brandKit = null, content = null, designReference = null } = input;
  assert(tenantId, 'tenantId required');
  assert(projectId, 'projectId required');
  assert(clientIdentity, 'clientIdentity required');
  assert(PRODUCT_SET.has(selectedProducts), `unknown product: ${selectedProducts}`);
  assert(Array.isArray(selectedModules), 'selectedModules must be an array');
  const unknown = selectedModules.filter((id) => !MODULES[id]);
  assert(!unknown.length, `unknown module(s): ${unknown.join(',')}`);

  const modules = selectedModules.map((id) => ({ id, ...MODULES[id] }));
  const capabilities = unique(modules.flatMap((m) => m.capabilities)).sort();
  const navigation = modules.map((m, index) => ({ moduleId: m.id, label: m.label, route: m.route, order: index + 1 }));
  const routes = Object.fromEntries(modules.map((m) => [m.id, m.route]));
  assert(new Set(Object.values(routes)).size === Object.values(routes).length, 'route collision');
  const ctaBindings = Object.fromEntries(modules.map((m) => [m.id, m.route]));
  const products = selectedProducts === 'website+portal' ? ['website','portal'] : [selectedProducts];

  return {
    schemaVersion: '1.0.0',
    kind: 'ApprovedAssemblyManifest',
    tenantId, projectId, clientIdentity, products,
    modules: modules.map(({ id }) => id),
    capabilities,
    navigation,
    surfaces: modules.map((m) => ({ moduleId: m.id, route: m.route, type: 'module-surface' })),
    routes,
    ctaBindings,
    permissions: Object.fromEntries(modules.map((m) => [m.id, ['tenant-member']])),
    dataBindings: Object.fromEntries(modules.map((m) => [m.id, m.capabilities.map((c) => `${tenantId}:${c}`)])),
    workflows: modules.map((m) => ({ moduleId: m.id, notifications: m.capabilities.includes('notifications') })),
    integrations: unique(capabilities.filter((c) => ['payments','calendar','notifications'].includes(c))),
    brandKit, content, designReference,
    acceptance: {
      requiredRoutes: navigation.map((n) => n.route),
      requiredModules: modules.map((m) => m.id),
      forbiddenManualWiring: true
    }
  };
}

export const moduleCatalog = Object.freeze(MODULES);
