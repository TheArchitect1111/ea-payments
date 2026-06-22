const apiUrlInput = document.getElementById('apiUrl');
const apiKeyInput = document.getElementById('apiKey');
const notifyEmailInput = document.getElementById('notifyEmail');
const portalSlugInput = document.getElementById('portalSlug');
const msg = document.getElementById('msg');

chrome.storage.sync.get(['apiUrl', 'apiKey', 'notifyEmail', 'portalSlug'], (data) => {
  apiUrlInput.value = data.apiUrl || 'https://ea-payments.vercel.app';
  apiKeyInput.value = data.apiKey || '';
  notifyEmailInput.value = data.notifyEmail || '';
  portalSlugInput.value = data.portalSlug || '';
});

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.set(
    {
      apiUrl: apiUrlInput.value.trim() || 'https://ea-payments.vercel.app',
      apiKey: apiKeyInput.value.trim(),
      notifyEmail: notifyEmailInput.value.trim(),
      portalSlug: portalSlugInput.value.trim(),
    },
    () => {
      msg.textContent = 'Saved.';
    }
  );
});
