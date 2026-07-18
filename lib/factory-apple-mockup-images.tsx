/**
 * Custom Apple-aesthetic Concept Pack mockups via next/og ImageResponse.
 * Client-branded PNG buffers for email (landing · ops portal · member home).
 */
import type { ReactElement, ReactNode } from 'react';
import { ImageResponse } from 'next/og';

export type AppleMockupBrand = {
  clientName: string;
  tagline: string;
  cta: string;
  score: number;
  capacityLabel: string;
  opportunityLabel: string;
  heroImageUrl?: string;
};

const W = 1200;
const H = 780;

async function toPngBuffer(element: ReactElement, size = { width: W, height: H }): Promise<Buffer> {
  const res = new ImageResponse(element, {
    ...size,
  });
  return Buffer.from(await res.arrayBuffer());
}

function Shell(props: {
  eyebrow: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        background: '#f5f5f7',
        color: '#1d1d1f',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          padding: '18px 36px',
          background: 'rgba(255,255,255,0.72)',
          borderBottom: '1px solid rgba(0,0,0,0.08)',
          fontSize: 13,
          letterSpacing: 2,
          textTransform: 'uppercase',
          color: '#6e6e73',
          fontWeight: 600,
        }}
      >
        {props.eyebrow}
      </div>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>{props.children}</div>
    </div>
  );
}

export async function renderAppleLandingPng(brand: AppleMockupBrand): Promise<Buffer> {
  const hero = brand.heroImageUrl;
  return toPngBuffer(
    <Shell eyebrow={`${brand.clientName} · Website / landing concept`}>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          padding: '40px 56px',
          background: hero
            ? `linear-gradient(180deg, rgba(245,245,247,0.2), rgba(245,245,247,0.92)), url(${hero})`
            : 'linear-gradient(180deg, #ffffff 0%, #f5f5f7 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div style={{ display: 'flex', fontSize: 14, color: '#6e6e73', marginBottom: 18, fontWeight: 500 }}>
          {brand.clientName}
        </div>
        <div
          style={{
            display: 'flex',
            fontSize: 64,
            fontWeight: 700,
            letterSpacing: -1.5,
            textAlign: 'center',
            lineHeight: 1.05,
            maxWidth: 900,
          }}
        >
          Designed to be simple. Built to convert.
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 22,
            fontSize: 24,
            color: '#6e6e73',
            textAlign: 'center',
            maxWidth: 720,
            lineHeight: 1.35,
          }}
        >
          {brand.tagline.slice(0, 160)}
        </div>
        <div
          style={{
            display: 'flex',
            marginTop: 34,
            background: '#0071e3',
            color: '#fff',
            padding: '14px 28px',
            borderRadius: 980,
            fontSize: 18,
            fontWeight: 600,
          }}
        >
          {brand.cta}
        </div>
        <div style={{ display: 'flex', marginTop: 36 }}>
          {[
            { label: 'Score', value: String(brand.score) },
            { label: 'Capacity', value: brand.capacityLabel },
            { label: 'Upside', value: brand.opportunityLabel },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                background: 'rgba(255,255,255,0.85)',
                borderRadius: 18,
                padding: '14px 22px',
                minWidth: 160,
                marginRight: 20,
              }}
            >
              <div style={{ display: 'flex', fontSize: 12, color: '#6e6e73', marginBottom: 6 }}>{item.label}</div>
              <div style={{ display: 'flex', fontSize: 20, fontWeight: 700 }}>{item.value}</div>
            </div>
          ))}
        </div>
      </div>
    </Shell>,
  );
}

export async function renderApplePortalPng(brand: AppleMockupBrand): Promise<Buffer> {
  const nav = ['Dashboard', 'People', 'Programs', 'Events', 'Payments', 'Messages'];
  return toPngBuffer(
    <Shell eyebrow={`${brand.clientName} · Ops portal concept`}>
      <div style={{ display: 'flex', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 240,
            background: '#ffffff',
            borderRight: '1px solid rgba(0,0,0,0.08)',
            padding: '28px 20px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, marginBottom: 28 }}>{brand.clientName}</div>
          {nav.map((item, i) => (
            <div
              key={item}
              style={{
                display: 'flex',
                padding: '12px 14px',
                marginBottom: 8,
                borderRadius: 12,
                background: i === 0 ? '#0071e3' : 'transparent',
                color: i === 0 ? '#fff' : '#1d1d1f',
                fontSize: 16,
                fontWeight: i === 0 ? 600 : 500,
              }}
            >
              {item}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 36 }}>
          <div style={{ display: 'flex', fontSize: 36, fontWeight: 700, letterSpacing: -0.5 }}>Good morning</div>
          <div style={{ display: 'flex', fontSize: 18, color: '#6e6e73', marginTop: 8 }}>
            Here’s what needs attention across {brand.clientName}.
          </div>
          <div style={{ display: 'flex', marginTop: 28 }}>
            {[
              { t: 'Capacity score', v: String(brand.score) },
              { t: 'Left on table', v: brand.capacityLabel },
              { t: 'Opportunity', v: brand.opportunityLabel },
            ].map((card) => (
              <div
                key={card.t}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  background: '#fff',
                  borderRadius: 22,
                  padding: 22,
                  marginRight: 16,
                  width: 260,
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', fontSize: 13, color: '#6e6e73' }}>{card.t}</div>
                <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, marginTop: 10 }}>{card.v}</div>
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              marginTop: 22,
              background: '#fff',
              borderRadius: 22,
              padding: 26,
              border: '1px solid rgba(0,0,0,0.06)',
              flex: 1,
            }}
          >
            <div style={{ display: 'flex', fontSize: 20, fontWeight: 700 }}>Command center</div>
            <div style={{ display: 'flex', fontSize: 16, color: '#6e6e73', marginTop: 10, lineHeight: 1.45 }}>
              Registrations, payments, events, and communications — one calm ops home instead of scattered tools.
            </div>
            <div
              style={{
                display: 'flex',
                marginTop: 24,
                height: 120,
                borderRadius: 16,
                background: 'linear-gradient(90deg, #0071e322, #0071e308)',
              }}
            />
          </div>
        </div>
      </div>
    </Shell>,
  );
}

export async function renderAppleMemberPng(brand: AppleMockupBrand): Promise<Buffer> {
  const tiles = ['Today’s focus', 'Next milestone', 'Highlights', 'Messages'];
  return toPngBuffer(
    <Shell eyebrow={`${brand.clientName} · Member home concept`}>
      <div style={{ display: 'flex', flex: 1 }}>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: 220,
            background: '#ffffff',
            borderRight: '1px solid rgba(0,0,0,0.08)',
            padding: '28px 18px',
          }}
        >
          <div style={{ display: 'flex', fontSize: 16, fontWeight: 700, marginBottom: 24 }}>{brand.clientName}</div>
          {['Home', 'My journey', 'Schedule', 'Resources', 'Profile'].map((item, i) => (
            <div
              key={item}
              style={{
                display: 'flex',
                padding: '11px 12px',
                marginBottom: 6,
                borderRadius: 12,
                background: i === 0 ? '#1d1d1f' : 'transparent',
                color: i === 0 ? '#fff' : '#1d1d1f',
                fontSize: 15,
                fontWeight: i === 0 ? 600 : 500,
              }}
            >
              {item}
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, padding: 36 }}>
          <div style={{ display: 'flex', fontSize: 34, fontWeight: 700 }}>Welcome back</div>
          <div style={{ display: 'flex', fontSize: 18, color: '#6e6e73', marginTop: 8 }}>
            Your journey with {brand.clientName}.
          </div>
          {brand.heroImageUrl ? (
            <img
              src={brand.heroImageUrl}
              alt=""
              width={860}
              height={200}
              style={{
                marginTop: 22,
                width: 860,
                height: 200,
                objectFit: 'cover',
                borderRadius: 22,
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                marginTop: 22,
                height: 200,
                borderRadius: 22,
                background: 'linear-gradient(135deg, #d2d2d7, #f5f5f7)',
              }}
            />
          )}
          <div style={{ display: 'flex', flexWrap: 'wrap', marginTop: 20 }}>
            {tiles.map((tile) => (
              <div
                key={tile}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 400,
                  background: '#fff',
                  borderRadius: 20,
                  padding: 20,
                  marginRight: 16,
                  marginBottom: 16,
                  border: '1px solid rgba(0,0,0,0.06)',
                }}
              >
                <div style={{ display: 'flex', fontSize: 18, fontWeight: 700 }}>{tile}</div>
                <div style={{ display: 'flex', fontSize: 14, color: '#6e6e73', marginTop: 8 }}>
                  Belonging, progress, and next steps — in one member home.
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Shell>,
  );
}

export async function renderAllAppleMockupPngs(brand: AppleMockupBrand): Promise<{
  landing: Buffer;
  portal: Buffer;
  member: Buffer;
}> {
  const [landing, portal, member] = await Promise.all([
    renderAppleLandingPng(brand),
    renderApplePortalPng(brand),
    renderAppleMemberPng(brand),
  ]);
  return { landing, portal, member };
}
