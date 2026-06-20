chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ea-capture',
    title: 'Capture with Magnifi™',
    contexts: ['page', 'link'],
  });
  chrome.contextMenus.create({
    id: 'ea-blueprint',
    title: 'Generate Auto Blueprint',
    contexts: ['page', 'link'],
  });
  chrome.contextMenus.create({
    id: 'ea-simplifi',
    title: 'Run Simplifi Assessment',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl || info.pageUrl || tab?.url;
  if (!url) return;

  if (info.menuItemId === 'ea-simplifi') {
    const { apiUrl } = await chrome.storage.sync.get(['apiUrl']);
    const base = apiUrl || 'https://ea-payments.vercel.app';
    chrome.tabs.create({ url: `${base}/assessment` });
    return;
  }

  const mode = info.menuItemId === 'ea-blueprint' ? 'blueprint' : 'capture';
  await captureUrl(url, mode);
});

async function captureUrl(url, mode = 'capture') {
  const { apiUrl, apiKey } = await chrome.storage.sync.get(['apiUrl', 'apiKey']);
  const base = apiUrl || 'https://ea-payments.vercel.app';
  if (!apiKey) {
    chrome.runtime.openOptionsPage();
    return;
  }

  try {
    const res = await fetch(`${base}/api/capture/ingest`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-EA-Capture-Key': apiKey,
      },
      body: JSON.stringify({ url, mode }),
    });
    const data = await res.json();
    if (data.ok) {
      chrome.action.setBadgeText({ text: mode === 'blueprint' ? 'BP' : '✓' });
      setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
      if (mode === 'blueprint' && data.blueprint) {
        chrome.storage.local.set({ lastBlueprint: data.blueprint });
      }
    }
  } catch (err) {
    console.error('EA capture failed', err);
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CAPTURE_URL') {
    captureUrl(msg.url, msg.mode || 'capture').then(() => sendResponse({ ok: true }));
    return true;
  }
});
