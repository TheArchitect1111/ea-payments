'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Puck, type Config, type Data } from '@measured/puck';
import '@measured/puck/puck.css';
import { EXPERIENCE_BUILDER_SEED_SECTIONS } from '@ea/website-engine';

type StudioProps = {
  EAHero: { eyebrow: string; title: string; description: string; buttonLabel: string };
  EAFeatures: { title: string; items: string };
  EATestimonials: { quote: string; name: string };
  EAGallery: { title: string; imageUrl: string; alt: string };
  EACtaBand: { title: string; description: string; buttonLabel: string };
  EAFAQ: { question: string; answer: string };
};

const config: Config<StudioProps> = {
  components: {
    EAHero: {
      label: 'Hero',
      fields: {
        eyebrow: { type: 'text' },
        title: { type: 'text' },
        description: { type: 'textarea' },
        buttonLabel: { type: 'text' },
      },
      defaultProps: {
        eyebrow: 'Efficiency Architects',
        title: 'Build an experience people understand immediately.',
        description: 'Use the EA Design Studio to shape the page while the Chassis handles the operational infrastructure underneath it.',
        buttonLabel: 'Get started',
      },
      render: ({ eyebrow, title, description, buttonLabel }) => (
        <section style={{ padding: '72px 7vw', background: '#f7f7f5', borderRadius: 28 }}>
          <div style={{ maxWidth: 920, margin: '0 auto' }}>
            <p style={{ fontSize: 13, letterSpacing: '.14em', textTransform: 'uppercase', fontWeight: 700 }}>{eyebrow}</p>
            <h1 style={{ fontSize: 'clamp(42px, 6vw, 78px)', lineHeight: .98, letterSpacing: '-.055em', margin: '18px 0' }}>{title}</h1>
            <p style={{ fontSize: 20, lineHeight: 1.55, maxWidth: 720, color: '#575757' }}>{description}</p>
            <button type="button" style={{ marginTop: 24, border: 0, borderRadius: 999, padding: '13px 20px', background: '#111', color: '#fff', fontWeight: 700 }}>{buttonLabel}</button>
          </div>
        </section>
      ),
    },
    EAFeatures: {
      label: 'Features',
      fields: {
        title: { type: 'text' },
        items: { type: 'textarea' },
      },
      defaultProps: {
        title: 'What this experience includes',
        items: 'Clear customer journey\nConnected portal\nAutomated next steps',
      },
      render: ({ title, items }) => (
        <section style={{ padding: '64px 7vw' }}>
          <div style={{ maxWidth: 980, margin: '0 auto' }}>
            <h2 style={{ fontSize: 42, letterSpacing: '-.04em' }}>{title}</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 16, marginTop: 28 }}>
              {items.split('\n').filter(Boolean).map((item) => <div key={item} style={{ padding: 24, border: '1px solid #e7e7e3', borderRadius: 20, background: '#fff' }}>{item}</div>)}
            </div>
          </div>
        </section>
      ),
    },
    EATestimonials: {
      label: 'Testimonials',
      fields: { quote: { type: 'textarea' }, name: { type: 'text' } },
      defaultProps: { quote: 'The experience feels simpler because the complexity is handled behind the scenes.', name: 'Client name' },
      render: ({ quote, name }) => (
        <section style={{ padding: '72px 7vw', textAlign: 'center' }}>
          <blockquote style={{ maxWidth: 820, margin: '0 auto', fontSize: 34, lineHeight: 1.25, letterSpacing: '-.035em' }}>“{quote}”</blockquote>
          <p style={{ marginTop: 18, color: '#676767' }}>{name}</p>
        </section>
      ),
    },
    EAGallery: {
      label: 'Gallery',
      fields: { title: { type: 'text' }, imageUrl: { type: 'text' }, alt: { type: 'text' } },
      defaultProps: { title: 'Show the work', imageUrl: 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1600&q=80', alt: 'Workspace' },
      render: ({ title, imageUrl, alt }) => (
        <section style={{ padding: '64px 7vw' }}>
          <div style={{ maxWidth: 1100, margin: '0 auto' }}>
            <h2 style={{ fontSize: 42, letterSpacing: '-.04em' }}>{title}</h2>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={imageUrl} alt={alt} style={{ width: '100%', height: 520, objectFit: 'cover', borderRadius: 28, marginTop: 24 }} />
          </div>
        </section>
      ),
    },
    EACtaBand: {
      label: 'CTA Band',
      fields: { title: { type: 'text' }, description: { type: 'textarea' }, buttonLabel: { type: 'text' } },
      defaultProps: { title: 'Ready for the next step?', description: 'Connect the experience to the EA Chassis and let the system carry the workflow forward.', buttonLabel: 'Continue' },
      render: ({ title, description, buttonLabel }) => (
        <section style={{ margin: '40px 7vw 72px', padding: 48, borderRadius: 28, background: '#111', color: '#fff' }}>
          <h2 style={{ fontSize: 42, letterSpacing: '-.04em', margin: 0 }}>{title}</h2>
          <p style={{ maxWidth: 680, fontSize: 18, lineHeight: 1.55, color: '#d7d7d7' }}>{description}</p>
          <button type="button" style={{ marginTop: 12, border: 0, borderRadius: 999, padding: '13px 20px', background: '#fff', color: '#111', fontWeight: 700 }}>{buttonLabel}</button>
        </section>
      ),
    },
    EAFAQ: {
      label: 'FAQ',
      fields: { question: { type: 'text' }, answer: { type: 'textarea' } },
      defaultProps: { question: 'What powers this website?', answer: 'The visual experience is assembled in Design Studio. EA Chassis services remain responsible for the operational functions behind it.' },
      render: ({ question, answer }) => (
        <section style={{ padding: '40px 7vw 72px' }}>
          <div style={{ maxWidth: 860, margin: '0 auto', borderTop: '1px solid #ddd', paddingTop: 28 }}>
            <h3 style={{ fontSize: 26 }}>{question}</h3>
            <p style={{ fontSize: 18, lineHeight: 1.6, color: '#5f5f5f' }}>{answer}</p>
          </div>
        </section>
      ),
    },
  },
};

const initialData: Data = {
  content: [],
  root: { props: { title: 'Untitled EA Website' } },
};

export default function WebsiteStudioClient() {
  const [status, setStatus] = useState('Draft');
  const approvedBlockCount = useMemo(() => EXPERIENCE_BUILDER_SEED_SECTIONS.length, []);

  function publish(data: Data) {
    window.localStorage.setItem('ea-design-studio:website-draft', JSON.stringify(data));
    setStatus('Saved in Design Studio');
  }

  return (
    <main style={{ minHeight: '100vh', background: '#f5f5f2' }}>
      <header style={{ padding: '22px 28px 18px', background: '#fff', borderBottom: '1px solid #e8e8e4' }}>
        <nav style={{ display: 'flex', gap: 18, alignItems: 'center', flexWrap: 'wrap' }}>
          <Link href="/admin/creative-studio">Campaigns</Link>
          <Link href="/admin/creative-studio/media">Media</Link>
          <Link href="/admin/creative-studio/brand">Brand</Link>
          <strong>Websites</strong>
        </nav>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 24, alignItems: 'end', marginTop: 22, flexWrap: 'wrap' }}>
          <div>
            <p style={{ margin: 0, fontSize: 12, textTransform: 'uppercase', letterSpacing: '.13em', fontWeight: 800 }}>EA Design Studio · Website Builder</p>
            <h1 style={{ margin: '8px 0 0', fontSize: 36, letterSpacing: '-.04em' }}>Build the experience. Keep the Chassis.</h1>
          </div>
          <div style={{ fontSize: 13, color: '#626262', textAlign: 'right' }}>
            <div>{approvedBlockCount} EA Website Engine blocks registered</div>
            <div>{status}</div>
          </div>
        </div>
      </header>
      <Puck config={config} data={initialData} onPublish={publish} />
    </main>
  );
}
