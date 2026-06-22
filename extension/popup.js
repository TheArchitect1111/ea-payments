function setStatus(text) {
  document.getElementById('status').textContent = text;
}

async function captureFromPopup(mode) {
  setStatus(mode === 'amplify' ? 'Amplifi — screenshot + background analyze…' : 'Simplifi — screenshot + background analyze…');
  chrome.runtime.sendMessage({ type: mode === 'amplify' ? 'AMPLIFY_PAGE' : 'CAPTURE_PAGE', mode }, (data) => {
    if (chrome.runtime.lastError) {
      setStatus(chrome.runtime.lastError.message);
      return;
    }
    if (!data?.ok) {
      setStatus(data?.error || 'Capture failed. Check extension settings.');
      return;
    }
    setStatus('Queued — keep browsing. Chrome will notify you when Magnifi is ready.');
    window.close();
  });
}

document.getElementById('capture').addEventListener('click', () => captureFromPopup('capture'));
document.getElementById('amplify').addEventListener('click', () => captureFromPopup('amplify'));

document.getElementById('options').addEventListener('click', (e) => {
  e.preventDefault();
  chrome.runtime.openOptionsPage();
});
