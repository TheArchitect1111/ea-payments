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

function text(id, value) {
  document.getElementById(id).textContent = value;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, (char) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  })[char]);
}

function renderCards(cards = []) {
  const brief = document.getElementById('brief');
  if (!cards.length) {
    brief.innerHTML = `
      <article class="card">
        <strong>Nothing urgent right now</strong>
        <span>Capture a page or add something to your watch list when a useful signal appears.</span>
      </article>
    `;
    return;
  }

  brief.innerHTML = cards.map((card) => `
    <article class="card">
      <strong>${escapeHtml(card.title)}</strong>
      <span>${escapeHtml(card.detail)}</span>
      ${card.href ? `<a href="${escapeHtml(card.href)}" target="_blank">Open</a>` : ''}
    </article>
  `).join('');
}

async function refreshBrief() {
  text('status', 'Refreshing...');
  const data = await send('SIMPLIFI_GET_BRIEF');
  if (data?.ok === false) {
    text('greeting', data.error || 'Connect Simplifi to load your Smart Brief.');
    renderCards([]);
    text('status', 'Open Settings or /extension/connect to pair this browser.');
    return;
  }

  text('greeting', data.greeting || 'Your Smart Brief is ready.');
  text('active-count', String(data.counts?.active || 0));
  text('attention-count', String(data.counts?.needsAttention || 0));
  text('watch-count', String(data.counts?.watchlist || 0));
  document.getElementById('workspace').href = data.workspaceUrl || 'https://ea-payments.vercel.app/simplifi/workspace';
  renderCards(data.cards || []);
  text('status', data.recommendedNext?.label ? `Next: ${data.recommendedNext.label}` : 'Ready.');
}

async function run(type, success) {
  text('status', 'Working...');
  const data = await send(type);
  if (data?.ok === false) {
    text('status', data.error || 'Action failed.');
    return;
  }
  text('status', success);
  await refreshBrief();
}

document.getElementById('capture').addEventListener('click', () => run('SIMPLIFI_CAPTURE_PAGE', 'Saved to Simplifi.'));
document.getElementById('watch').addEventListener('click', () => run('SIMPLIFI_WATCH_THIS', 'Added to watch list.'));
document.getElementById('refresh').addEventListener('click', refreshBrief);

refreshBrief();
