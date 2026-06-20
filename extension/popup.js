document.getElementById('capture').addEventListener('click', async () => {
  await sendCapture('capture', 'Sent to Mission Control.');
});

document.getElementById('blueprint').addEventListener('click', async () => {
  await sendCapture('blueprint', 'Auto Blueprint generated.');
});

document.getElementById('simplifi').addEventListener('click', async () => {
  const { apiUrl } = await chrome.storage.sync.get(['apiUrl']);
  const base = apiUrl || 'https://ea-payments.vercel.app';
  chrome.tabs.create({ url: `${base}/assessment` });
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

async function sendCapture(mode, successMsg) {
  const status = document.getElementById('status');
  status.textContent = mode === 'blueprint' ? 'Generating blueprint…' : 'Capturing…';
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (!tab?.url) {
    status.textContent = 'No active tab.';
    return;
  }
  chrome.runtime.sendMessage({ type: 'CAPTURE_URL', url: tab.url, mode }, (res) => {
    status.textContent = res?.ok ? successMsg : 'Failed — check Settings.';
  });
}
