chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'ea-capture',
    title: 'Capture with Magnifi™',
    contexts: ['page', 'link'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const url = info.linkUrl || info.pageUrl || tab?.url;
  if (!url) return;
  await captureUrl(url);
});

async function captureUrl(url) {
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
      body: JSON.stringify({ url }),
    });
    const data = await res.json();
    if (data.ok) {
      chrome.action.setBadgeText({ text: '✓' });
      setTimeout(() => chrome.action.setBadgeText({ text: '' }), 3000);
    }
  } catch (err) {
    console.error('EA capture failed', err);
  }
}

chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'CAPTURE_URL') {
    captureUrl(msg.url).then(() => sendResponse({ ok: true }));
    return true;
  }
});
