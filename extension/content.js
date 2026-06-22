(function () {
  if (document.getElementById('ea-product-fabs')) return;

  const wrap = document.createElement('div');
  wrap.id = 'ea-product-fabs';

  function runCapture(mode) {
    chrome.runtime.sendMessage({ type: mode === 'amplify' ? 'AMPLIFY_PAGE' : 'CAPTURE_PAGE', mode }, () => {
      showToast(mode === 'amplify' ? 'Amplifi queued — keep browsing.' : 'Simplifi queued — keep browsing.');
    });
  }

  function showToast(message) {
    let toast = document.getElementById('ea-capture-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ea-capture-toast';
      document.documentElement.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'ea-capture-toast ea-capture-toast-show';
    setTimeout(() => {
      toast.className = 'ea-capture-toast';
    }, 3200);
  }

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'EA_TOAST' && msg.message) showToast(msg.message);
  });

  const capture = document.createElement('button');
  capture.type = 'button';
  capture.className = 'ea-fab ea-fab-simplifi';
  capture.title = 'Simplifi — Screenshot & capture (background)';
  capture.textContent = 'Capture';
  capture.addEventListener('click', () => runCapture('capture'));

  const amplify = document.createElement('button');
  amplify.type = 'button';
  amplify.className = 'ea-fab ea-fab-amplifi';
  amplify.title = 'Amplifi — Screenshot & share (background)';
  amplify.textContent = 'Amplify';
  amplify.addEventListener('click', () => runCapture('amplify'));

  wrap.appendChild(capture);
  wrap.appendChild(amplify);
  document.documentElement.appendChild(wrap);
})();
