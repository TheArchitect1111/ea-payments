const SIMPLIFI_DEFAULT_BASE = 'https://ea-payments.vercel.app';
const SIMPLIFI_STORAGE_KEYS = [
  'apiUrl',
  'apiKey',
  'extensionToken',
  'tokenExpiresAt',
  'notifyEmail',
  'portalSlug',
  'watchlist',
  'recentOpportunities',
  'dailyBrief',
];

async function simplifiGetState() {
  const data = await chrome.storage.sync.get(SIMPLIFI_STORAGE_KEYS);
  return {
    apiUrl: data.apiUrl || SIMPLIFI_DEFAULT_BASE,
    apiKey: data.apiKey || '',
    extensionToken: data.extensionToken || '',
    tokenExpiresAt: typeof data.tokenExpiresAt === 'number' ? data.tokenExpiresAt : 0,
    notifyEmail: data.notifyEmail || '',
    portalSlug: data.portalSlug || '',
    watchlist: Array.isArray(data.watchlist) ? data.watchlist : [],
    recentOpportunities: Array.isArray(data.recentOpportunities) ? data.recentOpportunities : [],
    dailyBrief: data.dailyBrief || null,
  };
}

async function simplifiSetState(patch) {
  await chrome.storage.sync.set(patch);
}

async function refreshExtensionTokenIfNeeded(state) {
  if (!state.extensionToken) return state;
  const refreshSoon = !state.tokenExpiresAt || Date.now() > state.tokenExpiresAt - 24 * 60 * 60 * 1000;
  if (!refreshSoon) return state;

  const base = state.apiUrl || SIMPLIFI_DEFAULT_BASE;
  const response = await fetch(`${base}/api/extension/session/refresh`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${state.extensionToken}`,
      'X-EA-Extension-Token': state.extensionToken,
      'X-EA-Realm': 'simplifi',
    },
  });
  const data = await response.json().catch(() => null);
  if (!data?.ok || !data.extensionToken) return state;

  const next = {
    extensionToken: data.extensionToken,
    tokenExpiresAt: data.tokenExpiresAt || 0,
    portalSlug: data.portalSlug || state.portalSlug,
    apiKey: '',
  };
  await simplifiSetState(next);
  return { ...state, ...next };
}

async function simplifiFetch(path, init = {}) {
  let state = await simplifiGetState();
  state = await refreshExtensionTokenIfNeeded(state);
  const base = state.apiUrl || SIMPLIFI_DEFAULT_BASE;
  const headers = {
    ...(init.headers || {}),
    'X-EA-Realm': 'simplifi',
  };

  if (state.extensionToken) {
    headers.Authorization = `Bearer ${state.extensionToken}`;
    headers['X-EA-Extension-Token'] = state.extensionToken;
  } else if (state.apiKey) {
    // Legacy connect tokens — one release window
    headers['X-EA-Capture-Key'] = state.apiKey;
  }
  if (state.portalSlug) headers['X-EA-Portal-Slug'] = state.portalSlug;

  const response = await fetch(`${base}${path}`, {
    ...init,
    headers,
  });
  const data = await response.json().catch(() => ({ ok: false, error: 'Invalid Simplifi response.' }));
  if (!response.ok && data.ok !== false) {
    return { ok: false, error: `Simplifi request failed (${response.status}).` };
  }
  return data;
}

async function simplifiPost(path, payload) {
  return simplifiFetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });
}

self.SimplifiApi = {
  DEFAULT_BASE: SIMPLIFI_DEFAULT_BASE,
  STORAGE_KEYS: SIMPLIFI_STORAGE_KEYS,
  getState: simplifiGetState,
  setState: simplifiSetState,
  fetch: simplifiFetch,
  post: simplifiPost,
  getBrief: () => simplifiFetch('/api/extension/brief'),
  getWatchList: () => simplifiFetch('/api/extension/watch-list'),
  addWatchListItem: (payload) => simplifiPost('/api/extension/watch-list', payload),
  updateWatchListItem: (id, patch) =>
    simplifiFetch(`/api/extension/watch-list/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    }),
  archiveWatchListItem: (id) =>
    simplifiFetch(`/api/extension/watch-list/${id}`, { method: 'DELETE' }),
};
