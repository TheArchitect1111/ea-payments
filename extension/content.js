(function () {
  if (document.getElementById('simplifi-orb-root')) return;

  const root = document.createElement('div');
  root.id = 'simplifi-orb-root';
  root.innerHTML = `
    <button id="simplifi-orb" class="simplifi-orb simplifi-orb-idle" type="button" aria-label="Open Simplifi">
      <span class="simplifi-orb-ring"></span>
      <span class="simplifi-orb-core">S</span>
      <span class="simplifi-orb-state">Idle</span>
    </button>
    <section id="simplifi-panel" class="simplifi-panel" aria-label="Simplifi Opportunity Intelligence">
      <div class="simplifi-panel-head">
        <div>
          <p>Simplifi</p>
          <h2>Opportunity Intelligence</h2>
        </div>
        <button id="simplifi-close" type="button" aria-label="Close">x</button>
      </div>
      <p id="simplifi-context" class="simplifi-context">Watching this page for anything worth saving.</p>
      <div class="simplifi-actions">
        <button data-action="capture">Capture</button>
        <button data-action="watch">Watch</button>
        <button data-action="analyze">Analyze</button>
        <button data-action="followup">Follow Up</button>
        <button data-action="guide">Ask EA Guide</button>
        <button data-action="dashboard">Open Dashboard</button>
        <button data-action="watchlist">Open Watch List</button>
        <button data-action="recent">Recent Opportunities</button>
        <button data-action="brief">Daily Brief</button>
      </div>
      <div id="simplifi-output" class="simplifi-output">
        <strong>Suggested action</strong>
        <span>Capture this page if it contains a person, organization, funding source, client signal, or event you may need later.</span>
      </div>
    </section>
  `;
  document.documentElement.appendChild(root);

  const orb = document.getElementById('simplifi-orb');
  const panel = document.getElementById('simplifi-panel');
  const close = document.getElementById('simplifi-close');
  const output = document.getElementById('simplifi-output');
  const context = document.getElementById('simplifi-context');

  function pagePayload() {
    const title = document.title || location.hostname;
    const description = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
    const image = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
    return {
      title,
      url: location.href,
      notes: [
        description ? `Description: ${description}` : '',
        image ? `Image: ${image}` : '',
        `Captured from: ${location.hostname}`,
      ].filter(Boolean).join('\n'),
    };
  }

  function setOrbState(state, detail) {
    orb.className = `simplifi-orb simplifi-orb-${state || 'idle'}`;
    const label = orb.querySelector('.simplifi-orb-state');
    label.textContent = stateLabel(state);
    if (detail) context.textContent = detail;
  }

  function stateLabel(state) {
    if (state === 'watching') return 'Watching';
    if (state === 'found') return 'Found';
    if (state === 'followup') return 'Follow-up';
    if (state === 'action') return 'Action';
    return 'Idle';
  }

  function showToast(message, state) {
    let toast = document.getElementById('ea-capture-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'ea-capture-toast';
      document.documentElement.appendChild(toast);
    }
    toast.textContent = message;
    toast.className = 'ea-capture-toast ea-capture-toast-show';
    setOrbState(state || 'action', message);
    setTimeout(() => {
      toast.className = 'ea-capture-toast';
    }, 3200);
  }

  function setOutput(title, detail) {
    output.innerHTML = `<strong>${escapeHtml(title)}</strong><span>${escapeHtml(detail)}</span>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;',
    })[char]);
  }

  function send(type, options = {}) {
    return new Promise((resolve) => {
      chrome.runtime.sendMessage({ type, options }, (response) => {
        if (chrome.runtime.lastError) {
          resolve({ ok: false, error: chrome.runtime.lastError.message });
          return;
        }
        resolve(response || { ok: true });
      });
    });
  }

  async function runAction(action) {
    const payload = pagePayload();
    if (action === 'capture') {
      setOutput('Saving page', 'Simplifi is capturing this page and checking for opportunity signals.');
      const response = await send('SIMPLIFI_CAPTURE_PAGE', payload);
      showToast(response.ok ? 'Saved to Simplifi. Keep browsing.' : response.error || 'Capture failed.', response.ok ? 'watching' : 'idle');
      return;
    }
    if (action === 'watch') {
      const response = await send('SIMPLIFI_WATCH_THIS', { ...payload, category: 'Organization' });
      showToast(response.id ? `Watching ${response.title}` : response.error || 'Watch failed.', response.id ? 'watching' : 'idle');
      return;
    }
    if (action === 'analyze') {
      const response = await send('SIMPLIFI_CAPTURE_PAGE', { ...payload, notes: `${payload.notes}\nAnalyze this as an opportunity.` });
      showToast(response.ok ? 'Analysis queued.' : response.error || 'Analysis failed.', response.ok ? 'action' : 'idle');
      return;
    }
    if (action === 'followup') {
      const response = await send('SIMPLIFI_FOLLOW_UP', payload);
      showToast(response.id ? 'Follow-up reminder created.' : response.error || 'Could not create reminder.', response.id ? 'followup' : 'idle');
      return;
    }
    if (action === 'guide') {
      setOutput('EA Guide', 'Capture the page first, then use the story link or guidance page to decide the next action.');
      setOrbState('action', 'EA Guide is ready with next-step guidance.');
      return;
    }
    if (action === 'dashboard') {
      const state = await send('SIMPLIFI_GET_STATE');
      const fallback = `${String(state?.apiUrl || 'https://ea-payments.vercel.app').replace(/\/$/, '')}/simplifi/workspace`;
      const url = state?.orbUrls?.workspace || globalThis.EA_ORB_SDK?.urls?.workspace || fallback;
      window.open(url, '_blank', 'noopener,noreferrer');
      return;
    }
    if (action === 'watchlist' || action === 'recent') {
      const state = await send('SIMPLIFI_GET_STATE');
      const items = action === 'watchlist' ? state.watchlist || [] : state.recentOpportunities || [];
      setOutput(action === 'watchlist' ? 'Watch List' : 'Recent Opportunities', items.length ? items.slice(0, 4).map((item) => item.title).join(' | ') : 'Nothing saved yet.');
      return;
    }
    if (action === 'brief') {
      const brief = await send('SIMPLIFI_DAILY_BRIEF');
      setOutput('Daily Brief', `${brief.opportunities?.length || 0} recent captures. ${brief.watchlistActivity?.length || 0} watch items.`);
    }
  }

  orb.addEventListener('click', () => {
    panel.classList.toggle('simplifi-panel-open');
  });
  close.addEventListener('click', () => panel.classList.remove('simplifi-panel-open'));
  panel.addEventListener('click', (event) => {
    const action = event.target?.dataset?.action;
    if (action) void runAction(action);
  });

  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'EA_TOAST' && msg.message) showToast(msg.message, msg.state);
    if (msg.type === 'EA_ORB_STATE') setOrbState(msg.state, msg.detail);
  });

  const bodyText = document.body?.innerText?.toLowerCase() || '';
  if (/(grant|funding|hiring|speaker|rfp|partnership|sponsor|scholarship|apply|deadline)/i.test(bodyText.slice(0, 8000))) {
    setOrbState('found', 'Opportunity language detected on this page.');
  } else {
    setOrbState('watching', 'Watching this page quietly.');
  }
})();
