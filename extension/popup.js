document.getElementById('amplify').addEventListener('click', async () => {

  const status = document.getElementById('status');

  status.textContent = 'Opening Amplifi…';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url) {

    status.textContent = 'No active tab.';

    return;

  }

  chrome.runtime.sendMessage({ type: 'AMPLIFY_URL', url: tab.url }, (res) => {

    status.textContent = res?.ok ? 'Amplifi opened.' : 'Failed.';

  });

});



document.getElementById('capture').addEventListener('click', async () => {

  const status = document.getElementById('status');

  status.textContent = 'Capturing…';

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  if (!tab?.url) {

    status.textContent = 'No active tab.';

    return;

  }

  chrome.runtime.sendMessage({ type: 'CAPTURE_URL', url: tab.url, mode: 'capture' }, (res) => {

    status.textContent = res?.ok ? 'Sent to Simplifi.' : 'Failed — check Settings for API key.';

  });

});



document.getElementById('options').addEventListener('click', (e) => {

  e.preventDefault();

  chrome.runtime.openOptionsPage();

});

