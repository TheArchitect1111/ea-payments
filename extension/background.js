const DEFAULT_BASE = 'https://ea-payments.vercel.app';
const STORAGE_KEYS = ['apiUrl', 'apiKey', 'notifyEmail', 'portalSlug', 'watchlist', 'recentOpportunities', 'dailyBrief'];
const pendingStoryUrls = {};

function nowIso() {
  return new Date().toISOString();
}

function compactUrl(url = '') {
  try {
    const parsed = new URL(url);
    return `${parsed.hostname}${parsed.pathname === '/' ? '' : parsed.pathname}`;
  } catch {
    return url;
  }
}

async function getState() {
  const data = await chrome.storage.sync.get(STORAGE_KEYS);
  return {
    apiUrl: data.apiUrl || DEFAULT_BASE,
    apiKey: data.apiKey || '',
    notifyEmail: data.notifyEmail || '',
    portalSlug: data.portalSlug || '',
    watchlist: Array.isArray(data.watchlist) ? data.watchlist : [],
    recentOpportunities: Array.isArray(data.recentOpportunities) ? data.recentOpportunities : [],
    dailyBrief: data.dailyBrief || null,
  };
}

async function setState(patch) {
  await chrome.storage.sync.set(patch);
}

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

function canCaptureUrl(url = '') {
  return /^https?:\/\//i.test(url);
}

function notify(id, title, message, priority = 1) {
  chrome.notifications.create(id, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon128.png'),
    title,
    message,
    priority,
  });
}

function showToast(tabId, message, state = 'idle') {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { type: 'EA_TOAST', message, state }).catch(() => {});
}

function updateOrb(tabId, state, detail) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { type: 'EA_ORB_STATE', state, detail }).catch(() => {});
}

async function addRecentOpportunity(record) {
  const state = await getState();
  const next = [
    {
      id: record.id || `capture-${Date.now()}`,
      title: record.title || record.businessName || 'Captured opportunity',
      url: record.sourceUrl || record.shareUrl || '',
      storyUrl: record.storyUrl || record.magnifiUrl || '',
      createdAt: nowIso(),
      status: record.status || 'Captured',
    },
    ...state.recentOpportunities,
  ].slice(0, 12);
  await setState({ recentOpportunities: next });
  return next;
}

async function addWatchItem(input) {
  const state = await getState();
  const tab = input.tab || await activeTab();
  const title = input.title || input.text || tab?.title || 'Watch item';
  const url = input.url || tab?.url || '';
  const item = {
    id: `watch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.trim(),
    url,
    category: input.category || 'Opportunity',
    source: input.source || compactUrl(url),
    createdAt: nowIso(),
    lastCheckedAt: null,
    status: 'watching',
    notes: input.notes || '',
  };
  const next = [item, ...state.watchlist].slice(0, 100);
  await setState({ watchlist: next });
  if (tab?.id) {
    updateOrb(tab.id, 'watching', `Watching ${item.title}`);
    showToast(tab.id, `Watching: ${item.title}`, 'watching');
  }
  return item;
}

async function buildDailyBrief() {
  const state = await getState();
  const due = state.watchlist.slice(0, 3);
  const recent = state.recentOpportunities.slice(0, 3);
  const brief = {
    generatedAt: nowIso(),
    title: 'Today in Simplifi',
    opportunities: recent,
    watchlistActivity: due,
    followUpsDue: recent.filter((item) => item.createdAt && Date.now() - new Date(item.createdAt).getTime() > 7 * 86400000),
    topCapture: recent[0] || null,
  };
  await setState({ dailyBrief: brief });
  return brief;
}

async function pollCaptureStatus(base, apiKey, captureId, title, tabId) {
  chrome.action.setBadgeBackgroundColor({ color: '#C9A844' });
  chrome.action.setBadgeText({ text: '...' });
  updateOrb(tabId, 'action', 'Analyzing capture');

  for (let attempt = 0; attempt < 45; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const res = await fetch(`${base}/api/capture/${captureId}/status`, {
        headers: { 'X-EA-Capture-Key': apiKey },
      });
      const data = await res.json();
      if (data.ready) {
        const storyUrl = data.magnifiUrl?.startsWith('http')
          ? data.magnifiUrl
          : `${base}${data.magnifiUrl || `/magnifi/${captureId}`}`;
        pendingStoryUrls[captureId] = storyUrl;
        await addRecentOpportunity({
          id: captureId,
          title: data.record?.title || title,
          storyUrl,
          sourceUrl: data.record?.sourceUrl,
          status: data.status || 'Ready',
        });
        await buildDailyBrief();
        chrome.action.setBadgeText({ text: 'OK' });
        setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000);
        updateOrb(tabId, 'found', 'Opportunity story ready');
        notify(`capture-${captureId}`, 'Simplifi: story ready', data.record?.title || title || 'Tap to preview the opportunity.', 2);
        return storyUrl;
      }
    } catch (err) {
      console.error('Simplifi status poll failed', err);
    }
  }

  chrome.action.setBadgeText({ text: '!' });
  updateOrb(tabId, 'followup', 'Capture still processing');
  notify(`capture-timeout-${captureId}`, 'Simplifi is still working', 'Open your saved captures to check this item.', 1);
  return null;
}

async function captureTab(options = {}) {
  const state = await getState();
  const base = state.apiUrl || DEFAULT_BASE;

  if (!state.apiKey) {
    chrome.runtime.openOptionsPage();
    return { ok: false, error: 'Connect Simplifi first from /extension/connect.' };
  }

  const tab = options.tab || await activeTab();
  const url = options.url || tab?.url;
  if (!canCaptureUrl(url)) {
    return { ok: false, error: 'Cannot capture this browser page.' };
  }

  showToast(tab.id, options.screenshot === false ? 'Saving page to Simplifi...' : 'Capturing screenshot...', 'action');

  let screenshotBase64 = null;
  if (options.screenshot !== false) {
    try {
      const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
      screenshotBase64 = dataUrl.split(',')[1] || null;
    } catch (err) {
      console.warn('Screenshot capture failed; falling back to URL-only', err);
    }
  }

  const payload = {
    url,
    title: options.title || tab.title,
    selectedText: options.selectedText || '',
    notes: options.notes || '',
    source: options.source || 'Simplifi Extension',
    mode: options.mode || 'capture',
    screenshotBase64,
    async: true,
    notifyEmail: state.notifyEmail || undefined,
    portalSlug: state.portalSlug || undefined,
  };

  const res = await fetch(`${base}/api/capture/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-EA-Capture-Key': state.apiKey,
    },
    body: JSON.stringify(payload),
  });
  const data = await res.json();

  if (!data.ok) {
    showToast(tab.id, data.error || 'Capture failed.', 'idle');
    return data;
  }

  await addRecentOpportunity({
    id: data.captureId,
    title: payload.title,
    sourceUrl: url,
    status: data.processing ? 'Analyzing' : 'Captured',
  });

  showToast(tab.id, 'Saved. Keep browsing; Simplifi will notify you when it is ready.', 'watching');
  if (data.captureId) {
    pollCaptureStatus(base, state.apiKey, data.captureId, payload.title || url, tab.id);
  }
  return data;
}

async function createFollowUp(input = {}) {
  const tab = input.tab || await activeTab();
  const dueAt = Date.now() + (input.days || 14) * 86400000;
  const item = await addWatchItem({
    tab,
    title: input.title || tab?.title || 'Follow-up',
    url: input.url || tab?.url,
    category: 'Follow-Up',
    notes: `Follow up ${new Date(dueAt).toLocaleDateString()}`,
  });
  await chrome.storage.local.set({ [`followup:${item.id}`]: { ...item, dueAt } });
  chrome.alarms.create(`followup:${item.id}`, { when: dueAt });
  showToast(tab?.id, `Follow-up set for ${new Date(dueAt).toLocaleDateString()}`, 'followup');
  return item;
}

chrome.runtime.onInstalled.addListener((details) => {
  if (details.reason === 'install') {
    chrome.tabs.create({ url: `${DEFAULT_BASE}/extension/connect` });
  }

  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({ id: 'simplifi-capture-page', title: 'Save page to Simplifi', contexts: ['page', 'link', 'image'] });
    chrome.contextMenus.create({ id: 'simplifi-capture-selected', title: 'Save selected text to Simplifi', contexts: ['selection'] });
    chrome.contextMenus.create({ id: 'simplifi-watch-this', title: 'Watch this', contexts: ['page', 'selection', 'link'] });
    chrome.contextMenus.create({ id: 'simplifi-analyze-opportunity', title: 'Analyze opportunity', contexts: ['page', 'selection', 'link'] });
    chrome.contextMenus.create({ id: 'simplifi-follow-up', title: 'Create follow-up reminder', contexts: ['page', 'selection', 'link'] });
    chrome.contextMenus.create({ id: 'simplifi-send-magnifi', title: 'Send to Magnifi', contexts: ['page', 'selection', 'link'] });
  });

  chrome.alarms.create('simplifi-daily-brief', { periodInMinutes: 1440 });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText || '';
  const url = info.linkUrl || info.srcUrl || tab?.url || '';
  if (info.menuItemId === 'simplifi-watch-this') {
    await addWatchItem({ tab, title: selectedText || tab?.title || compactUrl(url), url, category: selectedText ? 'Topic' : 'Organization' });
    return;
  }
  if (info.menuItemId === 'simplifi-follow-up') {
    await createFollowUp({ tab, title: selectedText || tab?.title, url });
    return;
  }
  if (info.menuItemId === 'simplifi-capture-selected') {
    await captureTab({ tab, url: tab?.url, selectedText, title: selectedText.slice(0, 90) || tab?.title, notes: `Selected text: ${selectedText}`, screenshot: false });
    return;
  }
  if (info.menuItemId === 'simplifi-analyze-opportunity') {
    await captureTab({ tab, url, selectedText, title: selectedText || tab?.title, notes: 'Analyze this as an opportunity.', mode: 'capture' });
    return;
  }
  if (info.menuItemId === 'simplifi-send-magnifi') {
    await captureTab({ tab, url, selectedText, title: selectedText || tab?.title, notes: 'Build a Magnifi story from this.', mode: 'amplify' });
    return;
  }
  await captureTab({ tab, url });
});

chrome.notifications.onClicked.addListener((notificationId) => {
  const captureId = notificationId.replace('capture-', '');
  const storyUrl = pendingStoryUrls[captureId];
  if (storyUrl) chrome.tabs.create({ url: storyUrl });
});

chrome.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === 'simplifi-daily-brief') {
    const brief = await buildDailyBrief();
    notify('simplifi-daily-brief', brief.title, `${brief.opportunities.length} recent captures. ${brief.watchlistActivity.length} watch items.`, 1);
    return;
  }
  if (alarm.name.startsWith('followup:')) {
    const data = await chrome.storage.local.get(alarm.name);
    const item = data[alarm.name];
    if (item) {
      notify(alarm.name, 'Follow-up recommended', item.title || 'A saved opportunity is due for review.', 2);
    }
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'EA_EXTENSION_CONFIG' && msg.config) {
    const { apiUrl, apiKey, portalSlug, notifyEmail } = msg.config;
    chrome.storage.sync.set(
      {
        apiUrl: apiUrl || DEFAULT_BASE,
        apiKey: apiKey || '',
        portalSlug: portalSlug || '',
        notifyEmail: notifyEmail || '',
      },
      () => sendResponse({ ok: true }),
    );
    return true;
  }
  if (msg.type === 'SIMPLIFI_CAPTURE_PAGE') {
    captureTab(msg.options || {}).then(sendResponse);
    return true;
  }
  if (msg.type === 'SIMPLIFI_WATCH_THIS') {
    addWatchItem(msg.options || {}).then(sendResponse);
    return true;
  }
  if (msg.type === 'SIMPLIFI_FOLLOW_UP') {
    createFollowUp(msg.options || {}).then(sendResponse);
    return true;
  }
  if (msg.type === 'SIMPLIFI_DAILY_BRIEF') {
    buildDailyBrief().then(sendResponse);
    return true;
  }
  if (msg.type === 'SIMPLIFI_GET_STATE') {
    getState().then(sendResponse);
    return true;
  }
  if (msg.type === 'CAPTURE_PAGE' || msg.type === 'AMPLIFY_PAGE') {
    captureTab({ mode: msg.type === 'AMPLIFY_PAGE' ? 'amplify' : 'capture' }).then(sendResponse);
    return true;
  }
  return false;
});
