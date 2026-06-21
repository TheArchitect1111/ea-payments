(function () {
  if (document.getElementById('ea-amplifi-fab')) return;

  const fab = document.createElement('button');
  fab.id = 'ea-amplifi-fab';
  fab.type = 'button';
  fab.title = 'Amplifi™ — Amplify this page';
  fab.setAttribute('aria-label', 'Amplifi this page');
  fab.textContent = 'Amplify';

  fab.addEventListener('click', () => {
    chrome.storage.sync.get(['apiUrl'], (stored) => {
      const base = stored.apiUrl || 'https://ea-payments.vercel.app';
      const url = encodeURIComponent(window.location.href);
      window.open(`${base}/amplifi/share?url=${url}`, '_blank', 'noopener');
    });
  });

  document.documentElement.appendChild(fab);
})();
