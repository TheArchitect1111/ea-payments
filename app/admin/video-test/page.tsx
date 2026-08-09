'use client';

import { useState } from 'react';

export default function VideoTestPage() {
  const [prompt, setPrompt] = useState('Why wealthy people use debt differently.');
  const [busy, setBusy] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setBusy(true);
    setError(null);
    if (videoUrl) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    try {
      const response = await fetch('/api/integrations/video/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt, aspectRatio: '16:9' }),
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.error || `Generation failed (${response.status})`);
      }
      const blob = await response.blob();
      setVideoUrl(URL.createObjectURL(blob));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video generation failed.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={{ maxWidth: 860, margin: '48px auto', padding: 24, fontFamily: 'system-ui, sans-serif' }}>
      <p style={{ letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 12 }}>Efficiency Architects</p>
      <h1 style={{ fontSize: 40, marginBottom: 8 }}>Video Generation Test</h1>
      <p style={{ opacity: .7, marginBottom: 28 }}>Generate the first EA-created YouTube clip directly from the production video engine.</p>
      <label htmlFor="prompt" style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Video topic / prompt</label>
      <textarea id="prompt" value={prompt} onChange={(e) => setPrompt(e.target.value)} rows={5} style={{ width: '100%', padding: 16, fontSize: 18, borderRadius: 12, border: '1px solid #bbb', boxSizing: 'border-box' }} />
      <button onClick={generate} disabled={busy || !prompt.trim()} style={{ marginTop: 16, padding: '14px 24px', fontSize: 17, fontWeight: 700, borderRadius: 999, border: 0, cursor: busy ? 'wait' : 'pointer' }}>
        {busy ? 'Generating video…' : 'Generate 16:9 Test Video'}
      </button>
      {error && <pre style={{ whiteSpace: 'pre-wrap', marginTop: 24 }}>{error}</pre>}
      {videoUrl && (
        <section style={{ marginTop: 32 }}>
          <h2>Generated video</h2>
          <video src={videoUrl} controls playsInline style={{ width: '100%', borderRadius: 16, background: '#000' }} />
        </section>
      )}
    </main>
  );
}
