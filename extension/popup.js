document.getElementById('capture').addEventListener('click', async () => {
  const status = document.getElementById('status');
  status.textContent = 'Capturing…';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    status.textContent = 'No active tab.';
    return;
  }
  chrome.runtime.sendMessage({ type: 'CAPTURE_URL', url: tab.url }, (res) => {
    status.textContent = res?.ok ? 'Sent to Mission Control.' : 'Failed — check Settings.';
  });
});

document.getElementById('analyze').addEventListener('click', async () => {
  const { apiUrl } = await chrome.storage.sync.get(['apiUrl']);
  const base = apiUrl || 'https://ea-payments.vercel.app';
  chrome.tabs.create({ url: `${base}/admin/resource-radar` });
});

document.getElementById('options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
