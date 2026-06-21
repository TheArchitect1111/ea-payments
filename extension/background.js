chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ea-amplifi-page',
    title: 'Amplifi™ this page',
    contexts: ['page'],
  });
  chrome.contextMenus.create({
    id: 'ea-capture',
    title: 'Capture with Simplifi™',
    contexts: ['page', 'link'],
  });
  chrome.contextMenus.create({
    id: 'ea-blueprint',
    title: 'Generate Auto Blueprint',
    contexts: ['page', 'link'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl || info.pageUrl || tab?.url;
  if (!url) return;

  const { apiUrl } = await chrome.storage.sync.get(['apiUrl']);
  const base = apiUrl || 'https://ea-payments.vercel.app';

  if (info.menuItemId === 'ea-amplifi-page') {
    chrome.tabs.create({ url: `${base}/amplifi/share?url=${encodeURIComponent(url)}` });
    return;
  }

  if (info.menuItemId === 'ea-blueprint') {
    await captureUrl(url, 'blueprint');
    return;
  }

  if (info.menuItemId === 'ea-capture') {
    await captureUrl(url, 'capture');
  }
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
    }
  } catch (err) {
    console.error('EA capture failed', err);
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'AMPLIFY_URL') {
    chrome.storage.sync.get(['apiUrl'], (stored) => {
      const base = stored.apiUrl || 'https://ea-payments.vercel.app';
      chrome.tabs.create({
        url: `${base}/amplifi/share?url=${encodeURIComponent(msg.url)}`,
      });
      sendResponse({ ok: true });
    });
    return true;
  }
  if (msg.type === 'CAPTURE_URL') {
    captureUrl(msg.url, msg.mode || 'capture').then(() => sendResponse({ ok: true }));
    return true;
  }
});
