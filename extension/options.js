const apiUrlInput = document.getElementById('apiUrl');
const apiKeyInput = document.getElementById('apiKey');
const notifyEmailInput = document.getElementById('notifyEmail');
const portalSlugInput = document.getElementById('portalSlug');
const msg = document.getElementById('msg');

chrome.storage.sync.get(
  ['apiUrl', 'apiKey', 'extensionToken', 'tokenExpiresAt', 'notifyEmail', 'portalSlug'],
  (data) => {
    apiUrlInput.value = data.apiUrl || 'https://ea-payments.vercel.app';
    apiKeyInput.value = data.extensionToken
      ? '(connected via /extension/connect — scoped session)'
      : data.apiKey || '';
    apiKeyInput.readOnly = Boolean(data.extensionToken);
    notifyEmailInput.value = data.notifyEmail || '';
    portalSlugInput.value = data.portalSlug || '';
    if (data.extensionToken && data.tokenExpiresAt) {
      msg.textContent = `Connected. Session expires ${new Date(data.tokenExpiresAt).toLocaleString()}.`;
    }
  },
);

document.getElementById('save').addEventListener('click', () => {
  chrome.storage.sync.get(['extensionToken', 'tokenExpiresAt'], (existing) => {
    chrome.storage.sync.set(
      {
        apiUrl: apiUrlInput.value.trim() || 'https://ea-payments.vercel.app',
        apiKey: existing.extensionToken ? '' : apiKeyInput.value.trim(),
        notifyEmail: notifyEmailInput.value.trim(),
        portalSlug: portalSlugInput.value.trim(),
        extensionToken: existing.extensionToken || '',
        tokenExpiresAt: existing.tokenExpiresAt || 0,
      },
      () => {
        msg.textContent = existing.extensionToken
          ? 'Saved. Prefer reconnect at /extension/connect to refresh the session.'
          : 'Saved.';
      },
    );
  });
});
