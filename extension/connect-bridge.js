(function () {
  if (!location.pathname.startsWith('/extension/connect')) return;

  async function connect() {
    try {
      const res = await fetch('/api/extension/bootstrap', { credentials: 'include' });
      const data = await res.json();
      if (!data.ok) {
        window.postMessage(
          { type: 'EA_CONNECT_STATUS', ok: false, error: data.error || 'Bootstrap failed.' },
          '*',
        );
        return;
      }
      chrome.runtime.sendMessage({ type: 'EA_EXTENSION_CONFIG', config: data }, () => {
        const err = chrome.runtime.lastError;
        if (err) {
          window.postMessage({ type: 'EA_CONNECT_STATUS', ok: false, error: err.message }, '*');
          return;
        }
        window.postMessage({ type: 'EA_CONNECT_STATUS', ok: true }, '*');
      });
    } catch (err) {
      window.postMessage(
        { type: 'EA_CONNECT_STATUS', ok: false, error: err instanceof Error ? err.message : 'Connect failed.' },
        '*',
      );
    }
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', connect);
  } else {
    connect();
  }
})();
