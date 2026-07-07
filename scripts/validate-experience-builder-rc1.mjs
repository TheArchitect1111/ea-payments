/**
 * RC1 validation — full HTTP flow against local dev server.
 * Usage: node scripts/validate-experience-builder-rc1.mjs [baseUrl]
 */
const BASE = process.argv[2] || 'http://localhost:3456';
const EMAIL = process.env.DEMO_CLIENT_EMAIL || 'demo@efficiencyarchitects.online';
const PASSWORD = process.env.DEMO_CLIENT_PASSWORD || 'DemoPulse2026!';
const SLUG = 'demo-client';

function parseCookies(res) {
  const jar = new Map();
  const raw = typeof res.headers.getSetCookie === 'function' ? res.headers.getSetCookie() : [];
  const fallback = res.headers.get('set-cookie')
    ? res.headers.get('set-cookie').split(/,(?=\s*[^;=]+=[^;]+)/g)
    : [];
  for (const header of raw.length ? raw : fallback) {
    if (!header) continue;
    const part = header.split(';')[0];
    const i = part.indexOf('=');
    if (i > 0) jar.set(part.slice(0, i).trim(), part.slice(i + 1).trim());
  }
  return jar;
}

function cookieHeader(jar) {
  return [...jar.entries()].map(([k, v]) => `${k}=${v}`).join('; ');
}

const results = [];
function record(step, ok, extra = {}) {
  results.push({ step, ok, ...extra });
  console.log(ok ? '✓' : '✗', step, extra.detail || extra.error || '');
}

async function main() {
  console.log('Experience Builder RC1 validation —', BASE);

  const loginRes = await fetch(`${BASE}/api/portal/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: EMAIL, password: PASSWORD }),
  });
  const loginBody = await loginRes.json().catch(() => ({}));
  let cookies = parseCookies(loginRes);
  if (!loginRes.ok) {
    const demoRes = await fetch(`${BASE}/api/demo/session`, { method: 'POST' });
    const demoBody = await demoRes.json().catch(() => ({}));
    if (demoRes.ok && demoBody.ok) {
      cookies = parseCookies(demoRes);
      record('0-login', true, { slug: demoBody.slug, detail: 'demo session fallback' });
    } else {
      record('0-login', false, { error: loginBody.error || loginRes.status });
      console.log(JSON.stringify({ results }, null, 2));
      process.exit(1);
    }
  } else {
    record('0-login', true, { slug: loginBody.slug });
  }

  const cookie = cookieHeader(cookies);

  const listPageRes = await fetch(`${BASE}/portal/${SLUG}/experience-builder`, {
    headers: { Cookie: cookie },
    redirect: 'follow',
  });
  record('0b-portal-route', listPageRes.status === 200, {
    status: listPageRes.status,
  });

  const createRes = await fetch(`${BASE}/api/portal/experience-pages`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ slug: SLUG, title: 'RC1 Validation Test' }),
  });
  const createBody = await createRes.json().catch(() => ({}));
  record('1-create', createRes.ok && createBody.ok, { pageId: createBody.page?.id, error: createBody.error });
  if (!createBody.page?.id) {
    console.log(JSON.stringify({ results }, null, 2));
    process.exit(1);
  }
  const pageId = createBody.page.id;

  const puckData = {
    ...createBody.page.puckData,
    content: [
      ...createBody.page.puckData.content,
      {
        type: 'EATextSection',
        props: {
          id: 'text-rc1',
          label: 'Validation',
          title: 'Persistence check',
          body: 'This block should survive reload.',
        },
      },
    ],
  };

  const saveRes = await fetch(`${BASE}/api/portal/experience-pages/${pageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ slug: SLUG, title: 'RC1 Validation Test', puckData }),
  });
  const saveBody = await saveRes.json().catch(() => ({}));
  record('2-save-draft', saveRes.ok && saveBody.ok, { status: saveBody.page?.status });

  const loadRes = await fetch(`${BASE}/api/portal/experience-pages/${pageId}?slug=${SLUG}`, {
    headers: { Cookie: cookie },
  });
  const loadBody = await loadRes.json().catch(() => ({}));
  const blockTitle = loadBody.page?.puckData?.content?.[1]?.props?.title;
  record('3-4-reload-persist', loadRes.ok && blockTitle === 'Persistence check', {
    blockCount: loadBody.page?.puckData?.content?.length,
    blockTitle,
  });

  const previewPath = loadBody.page?.previewPath || `/preview/experience/${SLUG}/${pageId}`;
  const previewRes = await fetch(`${BASE}${previewPath}`);
  const previewHtml = await previewRes.text();
  record('5-preview', previewRes.ok && previewHtml.includes('Persistence check'), {
    status: previewRes.status,
    hasTitle: previewHtml.includes('Persistence check'),
  });

  const pubRes = await fetch(`${BASE}/api/portal/experience-pages/${pageId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ slug: SLUG }),
  });
  const pubBody = await pubRes.json().catch(() => ({}));
  record('6-publish', pubRes.ok && pubBody.ok, { mode: pubBody.mode, detail: pubBody.detail });

  const pubPreviewRes = await fetch(`${BASE}${previewPath}`);
  const pubHtml = await pubPreviewRes.text();
  record('7-published-render', pubPreviewRes.ok && pubHtml.includes('Persistence check'), {
    status: pubBody.page?.status,
  });

  puckData.content[1].props.title = 'Republish check';
  const editRes = await fetch(`${BASE}/api/portal/experience-pages/${pageId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ slug: SLUG, title: 'RC1 Validation Test', puckData }),
  });
  const editBody = await editRes.json().catch(() => ({}));
  record('8-edit-published', editRes.ok && editBody.page?.status === 'published', {
    statusAfterEdit: editBody.page?.status,
    detail: editBody.page?.status === 'published' ? 'status preserved' : 'B1 regression',
  });

  const repubRes = await fetch(`${BASE}/api/portal/experience-pages/${pageId}/publish`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Cookie: cookie },
    body: JSON.stringify({ slug: SLUG }),
  });
  const repubBody = await repubRes.json().catch(() => ({}));
  record('9-republish', repubRes.ok && repubBody.ok, {});

  const finalPreviewRes = await fetch(`${BASE}${previewPath}`);
  const finalHtml = await finalPreviewRes.text();
  record('10-changes-visible', finalPreviewRes.ok && finalHtml.includes('Republish check'), {
    hasNewTitle: finalHtml.includes('Republish check'),
  });

  const editorRes = await fetch(`${BASE}/portal/${SLUG}/experience-builder/${pageId}`, {
    headers: { Cookie: cookie },
    redirect: 'follow',
  });
  record('editor-route', editorRes.status === 200, { status: editorRes.status });

  console.log('\n--- SUMMARY ---');
  console.log(JSON.stringify({ results, pageId, previewPath, pass: results.every((r) => r.ok) }, null, 2));
  process.exit(results.every((r) => r.ok) ? 0 : 1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
