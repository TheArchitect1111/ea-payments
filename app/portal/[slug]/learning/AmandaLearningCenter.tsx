'use client';

import { useEffect, useMemo, useState } from 'react';
import { type AmandaPortalAudience } from '@/lib/amanda-catherine/config';
import { coursesForAccount } from '@/lib/amanda-catherine/course-content';
import type { AmandaCourseContent, AmandaLessonContent } from '@/lib/amanda-catherine/course-content';
import type { AmandaCourseProgress } from '@/lib/amanda-catherine/progress-store';

function embedUrl(value: string) {
  if (!value) return '';
  try {
    const url = new URL(value);
    if (url.hostname.includes('youtube.com')) {
      const id = url.searchParams.get('v');
      if (id) return `https://www.youtube-nocookie.com/embed/${id}`;
      if (url.pathname.startsWith('/embed/')) return value;
    }
    if (url.hostname === 'youtu.be') return `https://www.youtube-nocookie.com/embed/${url.pathname.slice(1)}`;
    if (url.hostname.includes('vimeo.com')) {
      const id = url.pathname.split('/').filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }
  } catch { return ''; }
  return value.match(/\.(mp4|webm)(\?.*)?$/i) ? value : '';
}

export default function AmandaLearningCenter({ audience, assignedCourseIds, isAdmin }: { audience: AmandaPortalAudience; assignedCourseIds: string[]; isAdmin: boolean }) {
  const courses = useMemo(() => coursesForAccount(audience, assignedCourseIds, isAdmin), [audience, assignedCourseIds, isAdmin]);
  const [courseId, setCourseId] = useState<string>(courses[0]?.id || '');
  const [progress, setProgress] = useState<AmandaCourseProgress | null>(null);
  const [content, setContent] = useState<AmandaCourseContent | null>(null);
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const [now, setNow] = useState(() => Date.now());
  const course = courses.find((item) => item.id === courseId) || courses[0];

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!courseId) return;
    void Promise.all([
      fetch(`/api/portal/amanda/progress?courseId=${encodeURIComponent(courseId)}`).then(async (res) => ({ ok: res.ok, data: await res.json() })),
      fetch(`/api/portal/amanda/course-content?courseId=${encodeURIComponent(courseId)}`).then(async (res) => ({ ok: res.ok, data: await res.json() })),
    ]).then(([p, c]) => {
      if (!p.ok || !c.ok) return setError(p.data.error || c.data.error || 'Unable to open this course.');
      setProgress(p.data.progress); setContent(c.data.content);
    });
  }, [courseId]);

  async function saveProgress(patch: Partial<AmandaCourseProgress>) {
    const res = await fetch('/api/portal/amanda/progress', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, ...patch }) });
    const data = await res.json();
    if (!res.ok) return setError(data.error || 'Unable to update progress.');
    setProgress(data.progress);
  }

  function updateLesson(patch: Partial<AmandaLessonContent>) {
    if (!content) return;
    setContent({ ...content, lessons: content.lessons.map((lesson, index) => index === selected ? { ...lesson, ...patch } : lesson) });
  }

  async function saveContent() {
    if (!content) return;
    setStatus('Saving…'); setError('');
    const res = await fetch('/api/portal/amanda/course-content', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ courseId, lessons: content.lessons }) });
    const data = await res.json();
    if (!res.ok) { setStatus(''); return setError(data.error || 'Unable to save course.'); }
    setContent(data.content); setStatus('Course saved.');
  }

  if (!course) return <section className="ak-learning-empty"><h2>No course assigned yet</h2><p>Amanda will assign your course when enrollment is confirmed.</p></section>;
  if (!progress || !content) return <p className="ep-module-card-note">Loading your course…</p>;
  const percent = Math.round((progress.completedLessons.length / course.lessons.length) * 100);
  const lesson = content.lessons[selected];
  const releaseAt = progress.lessonReleaseAt?.[lesson.title];
  const released = isAdmin || Boolean(now && releaseAt && new Date(releaseAt).getTime() <= now);
  const player = embedUrl(lesson.videoUrl);
  const directVideo = /\.(mp4|webm)(\?.*)?$/i.test(player);

  return <section className="ak-learning">
    <header className="ak-learning__header"><div><p className="ak-learning__eyebrow">My learning</p><h2>{course.title}</h2><p>Watch each lesson, complete the work, and track your path to certification.</p></div><label><span>Program</span><select value={courseId} onChange={(e) => { setError(''); setStatus(''); setSelected(0); setCourseId(e.target.value); }}>{courses.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}</select></label></header>
    <div className="ak-learning__progress"><strong>{percent}% complete</strong><div className="ak-learning__track"><span style={{ width: `${percent}%` }} /></div><small>{progress.completedLessons.length} of {course.lessons.length} lessons complete</small></div>
    {error ? <p className="ak-learning__error" role="alert">{error}</p> : null}
    <div className="ak-learning__workspace">
      <nav className="ak-learning__lessons" aria-label="Course lessons">{content.lessons.map((item, index) => {
        const release = progress.lessonReleaseAt?.[item.title];
        const open = isAdmin || Boolean(now && release && new Date(release).getTime() <= now);
        const complete = progress.completedLessons.includes(item.title);
        return <button key={item.title} type="button" className={selected === index ? 'is-active' : ''} onClick={() => setSelected(index)} disabled={!open}><span>{complete ? '✓' : open ? index + 1 : '🔒'}</span><span><strong>Week {index + 1}</strong><small>{item.title}</small></span></button>;
      })}</nav>
      <article className="ak-learning__lesson"><p className="ak-learning__eyebrow">Week {selected + 1}</p><h3>{lesson.title}</h3>
        {!released ? <div className="ak-learning__pending"><strong>Lesson not released</strong><p>{releaseAt ? `Available ${new Date(releaseAt).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short', timeZone: 'America/New_York' })} ET` : 'Release date pending.'}</p></div> : player ? <div className="ak-learning__video">{directVideo ? <video src={player} controls controlsList="nodownload" /> : <iframe src={player} title={lesson.title} allow="accelerometer; autoplay; encrypted-media; picture-in-picture" allowFullScreen />}</div> : <div className="ak-learning__pending"><strong>Video coming soon</strong><p>Amanda is preparing this lesson. Progress tracking is already active.</p></div>}
        {lesson.notes ? <div className="ak-learning__notes"><h4>Lesson notes</h4><p>{lesson.notes}</p></div> : null}
        {lesson.resourceUrl ? <a className="ep-btn ep-btn-secondary" href={lesson.resourceUrl} target="_blank" rel="noopener noreferrer">Open lesson resource</a> : null}
        {released && !isAdmin ? <button className="ep-btn" type="button" onClick={() => void saveProgress({ completedLessons: progress.completedLessons.includes(lesson.title) ? progress.completedLessons.filter((item) => item !== lesson.title) : [...progress.completedLessons, lesson.title] })}>{progress.completedLessons.includes(lesson.title) ? 'Mark as incomplete' : 'Mark lesson complete'}</button> : null}
        {isAdmin ? <div className="ak-learning__editor"><h4>Lesson setup</h4><label><span>Video link</span><input value={lesson.videoUrl} onChange={(e) => updateLesson({ videoUrl: e.target.value })} placeholder="YouTube, Vimeo, MP4 or WebM link" /></label><label><span>Lesson notes</span><textarea value={lesson.notes} onChange={(e) => updateLesson({ notes: e.target.value })} placeholder="Summary or directions" /></label><label><span>Resource link</span><input value={lesson.resourceUrl} onChange={(e) => updateLesson({ resourceUrl: e.target.value })} placeholder="Worksheet or supporting link" /></label><button className="ep-btn" type="button" onClick={() => void saveContent()}>Save course</button>{status ? <p>{status}</p> : null}</div> : null}
      </article>
    </div>
    {!isAdmin ? <section className="ak-learning__requirements"><h3>Completion requirements</h3>{course.practicalRequirements.map((requirement) => <label key={requirement}><input type="checkbox" checked={progress.practicalRequirements.includes(requirement)} onChange={(e) => void saveProgress({ practicalRequirements: e.target.checked ? [...progress.practicalRequirements, requirement] : progress.practicalRequirements.filter((item) => item !== requirement) })} /><span>{requirement.replaceAll('-', ' ')}</span></label>)}<p>{progress.certificateIssuedAt ? `Certificate earned ${new Date(progress.certificateIssuedAt).toLocaleDateString()}.` : 'Your certificate unlocks after all lessons and completion requirements are finished.'}</p>{progress.certificateIssuedAt ? <a className="ep-btn" href={`/api/portal/amanda/certificate?courseId=${courseId}`}>Download certificate</a> : null}</section> : null}
  </section>;
}
