'use client';

import { useEffect, useState } from 'react';
import { AMANDA_COURSES } from '@/lib/amanda-catherine/config';
import type { AmandaCourseProgress } from '@/lib/amanda-catherine/progress-store';

export default function AmandaLearningCenter() {
  const [courseId, setCourseId] = useState<string>(AMANDA_COURSES[0].id);
  const [progress, setProgress] = useState<AmandaCourseProgress | null>(null);
  const course = AMANDA_COURSES.find((item) => item.id === courseId) || AMANDA_COURSES[0];

  useEffect(() => {
    void fetch(`/api/portal/amanda/progress?courseId=${courseId}`)
      .then((res) => res.json())
      .then((data) => setProgress(data.progress || null));
  }, [courseId]);

  async function save(patch: Partial<AmandaCourseProgress>) {
    const res = await fetch('/api/portal/amanda/progress', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ courseId, ...patch }),
    });
    const data = await res.json();
    if (data.progress) setProgress(data.progress);
  }

  if (!progress) return <p className="ep-module-card-note">Loading your course progress…</p>;
  const percent = Math.round((progress.completedLessons.length / course.lessons.length) * 100);

  return (
    <section className="ep-module-card">
      <label className="ep-form-field">
        <span>Program</span>
        <select className="ep-input" value={courseId} onChange={(e) => setCourseId(e.target.value)}>
          {AMANDA_COURSES.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </label>
      <p className="ep-module-card-title">{percent}% complete</p>
      <ul className="ep-module-list">
        {course.lessons.map((lesson, index) => (
          <li key={lesson} className="ep-module-card">
            <label>
              <input
                type="checkbox"
                checked={progress.completedLessons.includes(lesson)}
                onChange={(e) => void save({
                  completedLessons: e.target.checked
                    ? [...progress.completedLessons, lesson]
                    : progress.completedLessons.filter((item) => item !== lesson),
                })}
              />{' '}
              Week {index + 1}: {lesson}
            </label>
          </li>
        ))}
      </ul>
      <label className="ep-form-field">
        <span>Assessment score</span>
        <input className="ep-input" type="number" min="0" max="100" value={progress.assessmentScore ?? ''} onChange={(e) => void save({ assessmentScore: Number(e.target.value) })} />
      </label>
      {course.practicalRequirements.map((requirement) => (
        <label key={requirement} className="ep-form-field">
          <span>
            <input
              type="checkbox"
              checked={progress.practicalRequirements.includes(requirement)}
              onChange={(e) => void save({
                practicalRequirements: e.target.checked
                  ? [...progress.practicalRequirements, requirement]
                  : progress.practicalRequirements.filter((item) => item !== requirement),
              })}
            />{' '}
            {requirement.replaceAll('-', ' ')}
          </span>
        </label>
      ))}
      <p className="ep-module-card-note">
        {progress.certificateIssuedAt
          ? `Certificate earned ${new Date(progress.certificateIssuedAt).toLocaleDateString()}.`
          : `Certificate unlocks after all lessons, practical requirements, and a score of ${course.passingScore}% or higher.`}
      </p>
      {progress.certificateIssuedAt ? (
        <p style={{ marginTop: 16 }}>
          <a className="ep-btn" href={`/api/portal/amanda/certificate?courseId=${courseId}`}>
            Download certificate
          </a>
        </p>
      ) : null}
    </section>
  );
}
