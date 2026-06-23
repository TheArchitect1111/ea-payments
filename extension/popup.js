function setStatus(text) {
  document.getElementById('status').textContent = text;
}

function send(type, options = {}) {
  return new Promise((resolve) => {
    chrome.runtime.sendMessage({ type, options }, (data) => {
      if (chrome.runtime.lastError) {
        resolve({ ok: false, error: chrome.runtime.lastError.message });
        return;
      }
      resolve(data || { ok: true });
    });
  });
}

function renderState(state) {
  document.getElementById('watch-count').textContent = `${state.watchlist?.length || 0} watched`;
  document.getElementById('recent-count').textContent = `${state.recentOpportunities?.length || 0} captures`;
  const recent = state.recentOpportunities || [];
  document.getElementById('recent').textContent = recent.length
    ? recent.slice(0, 4).map((item) => item.title).join(' | ')
    : 'Recent opportunities will appear here.';
}

async function refresh() {
  const state = await send('SIMPLIFI_GET_STATE');
  renderState(state);
}

async function run(type, success) {
  setStatus('Working...');
  const data = await send(type);
  if (data?.ok === false) {
    setStatus(data.error || 'Action failed. Check Settings.');
    return;
  }
  setStatus(success);
  await refresh();
}

document.getElementById('capture').addEventListener('click', () => run('SIMPLIFI_CAPTURE_PAGE', 'Saved. Keep browsing.'));
document.getElementById('watch').addEventListener('click', () => run('SIMPLIFI_WATCH_THIS', 'Added to watch list.'));
document.getElementById('analyze').addEventListener('click', () => run('SIMPLIFI_CAPTURE_PAGE', 'Analysis queued.'));
document.getElementById('followup').addEventListener('click', () => run('SIMPLIFI_FOLLOW_UP', 'Follow-up created.'));
document.getElementById('brief').addEventListener('click', async () => {
  setStatus('Generating brief...');
  const brief = await send('SIMPLIFI_DAILY_BRIEF');
  setStatus(`${brief.opportunities?.length || 0} captures, ${brief.watchlistActivity?.length || 0} watch items.`);
  await refresh();
});
document.getElementById('options').addEventListener('click', (event) => {
  event.preventDefault();
  chrome.runtime.openOptionsPage();
});

refresh();
