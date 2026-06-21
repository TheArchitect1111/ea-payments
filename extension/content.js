(function () {
  if (document.getElementById('ea-product-fabs')) return;

  const wrap = document.createElement('div');
  wrap.id = 'ea-product-fabs';

  function openPath(path, label) {
    chrome.storage.sync.get(['apiUrl'], (stored) => {
      const base = stored.apiUrl || 'https://ea-payments.vercel.app';
      const url = encodeURIComponent(window.location.href);
      window.open(`${base}${path}?url=${url}`, '_blank', 'noopener');
    });
  }

  const capture = document.createElement('button');
  capture.type = 'button';
  capture.className = 'ea-fab ea-fab-simplifi';
  capture.title = 'Simplifi™ — Capture this page';
  capture.textContent = 'Capture';
  capture.addEventListener('click', () => openPath('/capture', 'capture'));

  const amplify = document.createElement('button');
  amplify.type = 'button';
  amplify.className = 'ea-fab ea-fab-amplifi';
  amplify.title = 'Amplifi™ — Amplify & share';
  amplify.textContent = 'Amplify';
  amplify.addEventListener('click', () => openPath('/amplify', 'amplify'));

  wrap.appendChild(capture);
  wrap.appendChild(amplify);
  document.documentElement.appendChild(wrap);
})();
