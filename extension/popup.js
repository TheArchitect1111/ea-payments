function openProduct(path) {
  const status = document.getElementById('status');
  status.textContent = 'Opening…';
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const tab = tabs[0];
    if (!tab?.url) {
      status.textContent = 'No active tab.';
      return;
    }
    chrome.storage.sync.get(['apiUrl'], (stored) => {
      const base = stored.apiUrl || 'https://ea-payments.vercel.app';
      chrome.tabs.create({ url: `${base}${path}?url=${encodeURIComponent(tab.url)}` });
      status.textContent = 'Opened — sign in if needed. Magnifi opens after capture.';
    });
  });
}

document.getElementById('capture').addEventListener('click', () => openProduct('/capture'));
document.getElementById('amplify').addEventListener('click', () => openProduct('/amplify'));

document.getElementById('options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
