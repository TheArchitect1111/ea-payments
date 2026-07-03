const SIMPLIFI_DEFAULT_BASE = 'https://ea-payments.vercel.app';
const SIMPLIFI_STORAGE_KEYS = [
  'apiUrl',
  'apiKey',
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

async function simplifiFetch(path, init = {}) {
  const state = await simplifiGetState();
  const base = state.apiUrl || SIMPLIFI_DEFAULT_BASE;
  const headers = {
    ...(init.headers || {}),
  };

  if (state.apiKey) headers['X-EA-Capture-Key'] = state.apiKey;
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
};
