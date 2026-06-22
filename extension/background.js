const pendingMagnifiUrls = {};

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ea-simplifi-capture',
    title: 'Simplifi™ — Screenshot & capture this page',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: 'ea-amplifi-page',
    title: 'Amplifi™ — Screenshot & amplify',
    contexts: ['page'],
  });
});

function showToast(tabId, message) {
  if (!tabId) return;
  chrome.tabs.sendMessage(tabId, { type: 'EA_TOAST', message }).catch(() => {});
}

async function pollCaptureStatus(base, apiKey, captureId, title) {
  chrome.action.setBadgeBackgroundColor({ color: '#C9A844' });
  chrome.action.setBadgeText({ text: '…' });

  for (let attempt = 0; attempt < 45; attempt += 1) {
    await new Promise((resolve) => setTimeout(resolve, 2000));
    try {
      const res = await fetch(`${base}/api/capture/${captureId}/status`, {
        headers: { 'X-EA-Capture-Key': apiKey },
      });
      const data = await res.json();
      if (data.ready) {
        const magnifiUrl = data.magnifiUrl?.startsWith('http')
          ? data.magnifiUrl
          : `${base}${data.magnifiUrl ?? `/magnifi/${captureId}`}`;
        pendingMagnifiUrls[captureId] = magnifiUrl;
        chrome.action.setBadgeText({ text: '✓' });
        setTimeout(() => chrome.action.setBadgeText({ text: '' }), 5000);
        chrome.notifications.create(`capture-${captureId}`, {
          type: 'basic',
          iconUrl: chrome.runtime.getURL('icon128.png'),
          title: 'Amplifi — Your story is ready',
          message: data.record?.title || title || 'Tap to open Magnifi.',
          priority: 2,
        });
        return magnifiUrl;
      }
    } catch (err) {
      console.error('EA status poll failed', err);
    }
  }

  chrome.action.setBadgeText({ text: '!' });
  chrome.notifications.create(`capture-timeout-${captureId}`, {
    type: 'basic',
    iconUrl: chrome.runtime.getURL('icon128.png'),
    title: 'Amplifi capture still processing',
    message: 'Open your portal Pulse workspace to view the capture.',
  });
  return null;
}

async function captureActiveTab(mode = 'capture') {
  const { apiUrl, apiKey, notifyEmail, portalSlug } = await chrome.storage.sync.get([
    'apiUrl',
    'apiKey',
    'notifyEmail',
    'portalSlug',
  ]);
  const base = apiUrl || 'https://ea-payments.vercel.app';

  if (!apiKey) {
    chrome.runtime.openOptionsPage();
    return { ok: false, error: 'Missing API key' };
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url;
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) {
    return { ok: false, error: 'Cannot capture this tab.' };
  }

  showToast(tab.id, mode === 'amplify' ? 'Amplifi — capturing screenshot…' : 'Simplifi — capturing screenshot…');

  let screenshotBase64 = null;
  try {
    const dataUrl = await chrome.tabs.captureVisibleTab(tab.windowId, { format: 'png' });
    screenshotBase64 = dataUrl.split(',')[1] ?? null;
  } catch (err) {
    console.warn('Screenshot capture failed; falling back to URL-only', err);
  }

  const res = await fetch(`${base}/api/capture/ingest`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-EA-Capture-Key': apiKey,
    },
    body: JSON.stringify({
      url,
      title: tab.title,
      screenshotBase64,
      mode: mode === 'amplify' ? 'amplify' : 'capture',
      async: true,
      notifyEmail: notifyEmail || undefined,
      portalSlug: portalSlug || undefined,
    }),
  });

  const data = await res.json();
  if (!data.ok) {
    showToast(tab.id, data.error || 'Capture failed.');
    return data;
  }

  showToast(
    tab.id,
    screenshotBase64
      ? 'Captured — Magnifi building in background. Keep browsing.'
      : 'Captured URL — Magnifi building in background.',
  );

  if (data.captureId) {
    pollCaptureStatus(base, apiKey, data.captureId, tab.title || url);
  }

  return data;
}

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === 'ea-simplifi-capture') {
    await captureActiveTab('capture');
    return;
  }
  if (info.menuItemId === 'ea-amplifi-page') {
    await captureActiveTab('amplify');
  }
});

chrome.notifications.onClicked.addListener((notificationId) => {
  const captureId = notificationId.replace('capture-', '');
  const magnifiUrl = pendingMagnifiUrls[captureId];
  if (magnifiUrl) {
    chrome.tabs.create({ url: magnifiUrl });
  }
});

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg.type === 'CAPTURE_PAGE') {
    captureActiveTab(msg.mode || 'capture').then((data) => sendResponse(data));
    return true;
  }
  if (msg.type === 'AMPLIFY_PAGE') {
    captureActiveTab('amplify').then((data) => sendResponse(data));
    return true;
  }
  return false;
});
