const apiUrlInput = document.getElementById('apiUrl');
const apiKeyInput = document.getElementById('apiKey');
const msg = document.getElementById('msg');

chrome.storage.sync.get(['apiUrl', 'apiKey'], (data) => {
  apiUrlInput.value = data.apiUrl || 'https://ea-payments.vercel.app';
  apiKeyInput.value = data.apiKey || '';
});

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.set(
    {
      apiUrl: apiUrlInput.value.trim() || 'https://ea-payments.vercel.app',
      apiKey: apiKeyInput.value.trim(),
    },
    () => {
      msg.textContent = 'Saved.';
    }
  );
});
