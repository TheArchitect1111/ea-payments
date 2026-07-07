'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ExperiencePage } from '@/lib/experience-builder/types';
import '@/lib/experience-builder/experience-builder.css';

export default function ExperienceBuilderIndex({
  slug,
  pages,
}: {
  slug: string;
  pages: ExperiencePage[];
}) {
  const router = useRouter();

  async function createPage() {
    const response = await fetch('/api/portal/experience-pages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ slug, title: 'New experience' }),
    });
    const payload = await response.json();
    if (payload.ok && payload.page?.id) {
      router.push(`/portal/${slug}/experience-builder/${payload.page.id}`);
    }
  }

  return (
    <main className="ep-main">
      <div className="ep-welcome">
        <p className="ep-welcome-label">Experience Builder</p>
        <h1 className="ep-welcome-heading">Landing page experiences</h1>
        <p className="ep-panel-sub">Compose pages with EA Design System blocks. Save drafts, preview, then publish through the existing pipeline.</p>
      </div>

      <div style={{ marginBottom: '1rem' }}>
        <button type="button" className="ep-btn ep-btn-primary" onClick={createPage}>
          Create experience
        </button>
      </div>

      <div className="eb-list">
        {pages.length === 0 ? (
          <div className="ep-card">
            <p>No experiences yet. Create your first page to open the Puck editor.</p>
          </div>
        ) : (
          pages.map((page) => (
            <div key={page.id} className="eb-list-item">
              <div>
                <strong>{page.title}</strong>
                <div>
                  <span className={`eb-status${page.status === 'published' ? ' eb-status-published' : ''}`}>
                    {page.status}
                  </span>
                  <span style={{ marginLeft: '0.75rem', color: '#667085', fontSize: '0.85rem' }}>
                    Updated {new Date(page.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
              <div className="eb-builder-actions">
                <Link href={page.previewPath} className="ep-btn ep-btn-secondary" target="_blank">
                  Preview
                </Link>
                <Link href={`/portal/${slug}/experience-builder/${page.id}`} className="ep-btn ep-btn-primary">
                  Edit
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </main>
  );
}
