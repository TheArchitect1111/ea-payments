'use client';

import { useEffect, useState } from 'react';

type Engine = {
  id: 'remotion' | 'gemini';
  role: string;
  label: string;
  available: boolean;
  detail: string;
};

type Project = {
  id: string;
  title: string;
  topic: string;
  durationSeconds: number;
};

function deployedPreviewUrl(projectId: string): string {
  return `/video-factory/${projectId}.mp4`;
}

export default function VideoTestClient() {
  const [topic, setTopic] = useState('Why wealthy people use debt differently.');
  const [projectId, setProjectId] = useState('wealthy-debt');
  const [engine, setEngine] = useState<'remotion' | 'gemini'>('remotion');
  const [engines, setEngines] = useState<Engine[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [title, setTitle] = useState('Why wealthy people use debt differently');
  const [description, setDescription] = useState('');
  const [busy, setBusy] = useState<'idle' | 'render' | 'publish'>('idle');
  const [videoUrl, setVideoUrl] = useState<string | null>(deployedPreviewUrl('wealthy-debt'));
  const [error, setError] = useState<string | null>(null);
  const [publishResult, setPublishResult] = useState<string | null>(null);

  useEffect(() => {
    void fetch('/api/admin/video-factory/render')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data.engines)) setEngines(data.engines);
        if (Array.isArray(data.projects)) {
          setProjects(data.projects);
          const first = data.projects[0] as Project | undefined;
          if (first) {
            setProjectId(first.id);
            setTitle(first.title);
            setTopic(first.topic);
            setVideoUrl(deployedPreviewUrl(first.id));
          }
        }
      })
      .catch(() => {
        setError('Could not load video factory status.');
      });
  }, []);

  useEffect(() => () => {
    if (videoUrl?.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
  }, [videoUrl]);

  async function generate() {
    setBusy('render');
    setError(null);
    setPublishResult(null);
    if (videoUrl?.startsWith('blob:')) URL.revokeObjectURL(videoUrl);
    setVideoUrl(null);
    try {
      if (engine === 'gemini') {
        const response = await fetch('/api/integrations/video/generate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: topic, aspectRatio: '16:9' }),
        });
        if (!response.ok) {
          const data = await response.json().catch(() => ({}));
          throw new Error(data.error || `Gemini generation failed (${response.status})`);
        }
        const blob = await response.blob();
        setVideoUrl(URL.createObjectURL(blob));
        return;
      }

      const response = await fetch('/api/admin/video-factory/render', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ projectId, topic, engine: 'remotion' }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.error || `Remotion render failed (${response.status})`);
      }
      if (typeof data.previewUrl !== 'string' || !data.previewUrl) {
        throw new Error('Remotion render did not return a preview URL.');
      }
      if (typeof data.title === 'string' && data.title) setTitle(data.title);
      if (typeof data.description === 'string' && !description) setDescription(data.description);
      setVideoUrl(`${data.previewUrl}?t=${Date.now()}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Video generation failed.');
    } finally {
      setBusy('idle');
    }
  }

  async function publish() {
    setBusy('publish');
    setError(null);
    setPublishResult(null);
    try {
      const response = await fetch('/api/admin/video-factory/publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          projectId,
          topic,
          title,
          description,
          privacyStatus: 'private',
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || data.status || 'Publish failed');
      setPublishResult(`Uploaded privately to YouTube${data.videoId ? ` (${data.videoId})` : ''}.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'YouTube publish failed.');
    } finally {
      setBusy('idle');
    }
  }

  return (
    <main style={{ maxWidth: 880, margin: '0 auto', padding: '12px 8px 48px' }}>
      <p style={{ letterSpacing: '.12em', textTransform: 'uppercase', fontSize: 12, color: 'var(--ea-gold)' }}>
        Efficiency Architects
      </p>
      <h1 style={{ fontSize: 36, margin: '8px 0 10px', color: 'var(--ea-navy)' }}>Video Factory Test</h1>
      <p style={{ opacity: 0.75, marginBottom: 24, maxWidth: 720 }}>
        Primary engine is Remotion — programmatic 1080p documentary scenes. Gemini remains an optional
        cinematic provider and is not required to produce an episode.
      </p>

      <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Project</label>
      <select
        value={projectId}
        onChange={(e) => {
          const next = e.target.value;
          setProjectId(next);
          setVideoUrl(deployedPreviewUrl(next));
          const match = projects.find((item) => item.id === next);
          if (match) {
            setTitle(match.title);
            setTopic(match.topic);
          }
        }}
        style={{ width: '100%', padding: 12, marginBottom: 16, borderRadius: 10, border: '1px solid #bbb' }}
      >
        {projects.map((project) => (
          <option key={project.id} value={project.id}>
            {project.title} ({Math.round(project.durationSeconds)}s)
          </option>
        ))}
      </select>

      <label style={{ display: 'block', fontWeight: 700, marginBottom: 8 }}>Topic</label>
      <textarea
        value={topic}
        onChange={(e) => setTopic(e.target.value)}
        rows={3}
        style={{ width: '100%', padding: 14, fontSize: 16, borderRadius: 10, border: '1px solid #bbb', boxSizing: 'border-box' }}
      />

      <label style={{ display: 'block', fontWeight: 700, margin: '16px 0 8px' }}>Engine</label>
      <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 16 }}>
        {(engines.length ? engines : [
          { id: 'remotion' as const, role: 'primary', label: 'Remotion', available: true, detail: '' },
          { id: 'gemini' as const, role: 'optional', label: 'Gemini', available: false, detail: '' },
        ]).map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => setEngine(item.id)}
            disabled={!item.available && item.id === 'gemini'}
            style={{
              padding: '10px 14px',
              borderRadius: 999,
              border: engine === item.id ? '2px solid var(--ea-navy)' : '1px solid #ccc',
              background: engine === item.id ? 'var(--ea-navy)' : '#fff',
              color: engine === item.id ? '#fff' : 'inherit',
              cursor: item.available || item.id === 'remotion' ? 'pointer' : 'not-allowed',
            }}
          >
            {item.label} · {item.role}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={() => void generate()}
        disabled={busy !== 'idle' || !topic.trim()}
        style={{
          padding: '14px 24px',
          fontSize: 16,
          fontWeight: 700,
          borderRadius: 999,
          border: 0,
          background: 'var(--ea-navy)',
          color: '#fff',
          cursor: busy === 'idle' ? 'pointer' : 'wait',
        }}
      >
        {busy === 'render' ? 'Generating video…' : 'Generate Video'}
      </button>

      {error ? <pre style={{ whiteSpace: 'pre-wrap', marginTop: 20, color: '#8a1f1f' }}>{error}</pre> : null}

      {videoUrl ? (
        <section style={{ marginTop: 28 }}>
          <h2>Preview</h2>
          <video src={videoUrl} controls playsInline preload="metadata" style={{ width: '100%', borderRadius: 16, background: '#000' }} />
          <label style={{ display: 'block', fontWeight: 700, margin: '20px 0 8px' }}>YouTube title</label>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #bbb', boxSizing: 'border-box' }}
          />
          <label style={{ display: 'block', fontWeight: 700, margin: '16px 0 8px' }}>Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="Defaults to the project description if left blank."
            style={{ width: '100%', padding: 12, borderRadius: 10, border: '1px solid #bbb', boxSizing: 'border-box' }}
          />
          <button
            type="button"
            onClick={() => void publish()}
            disabled={busy !== 'idle' || engine !== 'remotion'}
            style={{
              marginTop: 16,
              padding: '14px 24px',
              fontSize: 16,
              fontWeight: 700,
              borderRadius: 999,
              border: 0,
              background: 'var(--ea-gold)',
              color: 'var(--ea-navy)',
              cursor: busy === 'idle' && engine === 'remotion' ? 'pointer' : 'wait',
            }}
          >
            {busy === 'publish' ? 'Publishing…' : 'Publish to YouTube (private)'}
          </button>
          {engine === 'gemini' ? (
            <p style={{ fontSize: 13, opacity: 0.7 }}>YouTube publish from this console uses the Remotion render on disk. Generate with Remotion first.</p>
          ) : null}
          {publishResult ? <p style={{ marginTop: 12, fontWeight: 700 }}>{publishResult}</p> : null}
        </section>
      ) : null}
    </main>
  );
}
