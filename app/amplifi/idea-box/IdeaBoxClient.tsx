'use client';

import Image from 'next/image';
import { ChangeEvent, useEffect, useMemo, useState } from 'react';

type Opportunity = {
  title: string;
  format: string;
  angle: string;
  reason: string;
  campaignBrief: string;
};

type SavedDump = {
  id: string;
  text: string;
  links: string[];
  files: Array<{ name: string; type: string }>;
  createdAt: string;
};

const IDEA_STORAGE_KEY = 'amplifi:idea-box:v1';
const CAMPAIGN_BRIEF_STORAGE_KEY = 'amplifi:create-for-me:brief';

function readSaved(): SavedDump[] {
  try {
    const raw = window.localStorage.getItem(IDEA_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as SavedDump[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function IdeaBoxClient({ loggedIn }: { loggedIn: boolean }) {
  const [text, setText] = useState('');
  const [linkInput, setLinkInput] = useState('');
  const [links, setLinks] = useState<string[]>([]);
  const [files, setFiles] = useState<File[]>([]);
  const [savedIdeas, setSavedIdeas] = useState<SavedDump[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => setSavedIdeas(readSaved()), []);

  const sourceCount = useMemo(() => links.length + files.length + (text.trim() ? 1 : 0), [files.length, links.length, text]);

  const saveDump = () => {
    if (!sourceCount) {
      setMessage('Add a thought, link or file first.');
      return null;
    }
    const item: SavedDump = {
      id: crypto.randomUUID(),
      text: text.trim(),
      links,
      files: files.map((file) => ({ name: file.name, type: file.type || 'file' })),
      createdAt: new Date().toISOString(),
    };
    const next = [item, ...savedIdeas].slice(0, 40);
    window.localStorage.setItem(IDEA_STORAGE_KEY, JSON.stringify(next));
    setSavedIdeas(next);
    return item;
  };

  const addLink = () => {
    const value = linkInput.trim();
    if (!value) return;
    try {
      const normalized = new URL(value).toString();
      setLinks((current) => current.includes(normalized) ? current : [...current, normalized]);
      setLinkInput('');
      setMessage('');
    } catch {
      setMessage('Enter a complete link, including https://');
    }
  };

  const handleFiles = (event: ChangeEvent<HTMLInputElement>) => {
    setFiles(Array.from(event.target.files ?? []).slice(0, 8));
    setMessage('');
  };

  const analyze = async () => {
    const dump = saveDump();
    if (!dump) return;
    if (!loggedIn) {
      window.sessionStorage.setItem('amplifi:idea-box:pending', JSON.stringify(dump));
      window.location.assign('/portal/login?next=%2Famplifi%2Fidea-box');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      const response = await fetch('/api/portal/amplifi/idea-box', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dump),
      });
      const data = await response.json() as { ok?: boolean; error?: string; opportunities?: Opportunity[] };
      if (!response.ok || !data.ok || !Array.isArray(data.opportunities)) {
        setMessage(data.error || 'Amplifi could not analyze this idea yet.');
        return;
      }
      setOpportunities(data.opportunities);
    } catch {
      setMessage('Amplifi could not reach the Idea Box analyzer. Your brain dump is still saved.');
    } finally {
      setBusy(false);
    }
  };

  const buildOpportunity = (item: Opportunity) => {
    window.sessionStorage.setItem(CAMPAIGN_BRIEF_STORAGE_KEY, JSON.stringify({
      promotion: item.title,
      audience: '',
      result: item.angle,
      callToAction: 'Learn more',
      details: `${item.campaignBrief}\n\nSource material:\n${text.trim()}\n${links.join('\n')}`.trim(),
      tone: 'Warm and human',
      proofPoint: '',
      painQuestion: '',
      ctaUrl: links[0] || '',
      promotionScope: 'single',
    }));
    window.location.assign('/amplifi/workspace');
  };

  return (
    <main className="idea-shell">
      <header className="idea-header">
        <a href="/amplifi/workspace" aria-label="Back to Amplifi">
          <Image src="/amplifi/amplifi-logo-premium.png" alt="Amplifi" width={1973} height={797} priority />
        </a>
        <a className="idea-back" href="/amplifi/workspace">← Back to Amplifi</a>
      </header>

      <section className="idea-hero">
        <span>AMPLIFI IDEA BOX</span>
        <h1>Give Amplifi whatever you have.</h1>
        <p>Brain dump the thought, event, inspiration, link, screenshot, flyer or half-formed idea. Amplifi finds the content opportunities hiding inside it.</p>
      </section>

      <section className="idea-grid">
        <div className="idea-composer">
          <div className="idea-section-heading">
            <div><span>＋ BRAIN DUMP</span><h2>What’s on your mind?</h2></div>
            <small>{sourceCount} source{sourceCount === 1 ? '' : 's'} added</small>
          </div>

          <label className="idea-field">
            <span>Thoughts, event details, rough copy, inspiration</span>
            <textarea value={text} onChange={(event) => setText(event.target.value)} placeholder="Type it exactly as it comes to you. It does not need to be organized." />
          </label>

          <div className="idea-link-row">
            <label className="idea-field"><span>Link</span><input value={linkInput} onChange={(event) => setLinkInput(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); addLink(); } }} placeholder="https://..." /></label>
            <button type="button" onClick={addLink}>Add link</button>
          </div>

          {links.length ? <div className="idea-chips">{links.map((link) => <button type="button" key={link} onClick={() => setLinks((current) => current.filter((item) => item !== link))}>{new URL(link).hostname} ×</button>)}</div> : null}

          <label className="idea-upload">
            <input type="file" multiple accept="image/*,.pdf,.doc,.docx,.txt,.ppt,.pptx" onChange={handleFiles} />
            <strong>＋ Add images or files</strong>
            <small>Photos, screenshots, flyers, PDFs and working documents</small>
          </label>

          {files.length ? <div className="idea-file-list">{files.map((file) => <span key={`${file.name}-${file.size}`}>{file.type.startsWith('image/') ? '▧' : '▤'} {file.name}</span>)}</div> : null}

          {message ? <p className="idea-message" role="status">{message}</p> : null}

          <div className="idea-actions">
            <button type="button" className="idea-save" onClick={() => { if (saveDump()) setMessage('Saved to your Idea Box.'); }}>Save for later</button>
            <button type="button" className="idea-analyze" onClick={() => void analyze()} disabled={busy || !sourceCount}>{busy ? 'Finding opportunities…' : 'Find the opportunities →'}</button>
          </div>
        </div>

        <aside className="idea-bank">
          <span>YOUR IDEA BANK</span>
          <h2>{savedIdeas.length} saved idea{savedIdeas.length === 1 ? '' : 's'}</h2>
          <p>Nothing has to become a post today. Keep feeding Amplifi raw material and come back when you need content.</p>
          <div className="idea-bank-list">
            {savedIdeas.slice(0, 5).map((idea) => (
              <button type="button" key={idea.id} onClick={() => { setText(idea.text); setLinks(idea.links); setFiles([]); setOpportunities([]); }}>
                <strong>{idea.text.slice(0, 72) || idea.links[0] || idea.files[0]?.name || 'Saved idea'}</strong>
                <small>{new Date(idea.createdAt).toLocaleDateString()} · {idea.links.length + idea.files.length + (idea.text ? 1 : 0)} sources</small>
              </button>
            ))}
            {!savedIdeas.length ? <div className="idea-empty">Your future posts start here.</div> : null}
          </div>
        </aside>
      </section>

      {opportunities.length ? (
        <section className="idea-results">
          <div className="idea-results-heading"><span>AMPLIFI FOUND {opportunities.length} OPPORTUNITIES</span><h2>This is bigger than one post.</h2><p>Choose what feels useful. Amplifi will carry the selected idea into the campaign builder.</p></div>
          <div className="idea-opportunities">
            {opportunities.map((item, index) => (
              <article key={`${item.title}-${index}`}>
                <small>{String(index + 1).padStart(2, '0')} · {item.format}</small>
                <h3>{item.title}</h3>
                <p>{item.angle}</p>
                <em>{item.reason}</em>
                <button type="button" onClick={() => buildOpportunity(item)}>Build this in Amplifi →</button>
              </article>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
