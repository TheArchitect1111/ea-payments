/**
 * Story-first concept renders for Opportunity Intelligence Brief™.
 * Future Website (browser) · Ops Portal (laptop) · Member Experience (phone).
 */
import type { ReactElement, ReactNode } from 'react';
import { ImageResponse } from 'next/og';

export type ConceptRenderBrand = {
  clientName: string;
  tagline: string;
  cta: string;
  score: number;
  capacityLabel: string;
  opportunityLabel: string;
  heroImageUrl?: string;
  primaryColor?: string;
  accentColor?: string;
  logoUrl?: string;
  headline?: string;
  story?: string;
  portalModules?: string[];
  memberPersona?: string;
  memberTiles?: string[];
  programLabels?: string[];
};

/** @deprecated alias */
export type AppleMockupBrand = ConceptRenderBrand;

const W = 1200;
const H = 780;

async function toPngBuffer(element: ReactElement, size = { width: W, height: H }): Promise<Buffer> {
  const res = new ImageResponse(element, { ...size });
  return Buffer.from(await res.arrayBuffer());
}

function colors(brand: ConceptRenderBrand) {
  return {
    primary: brand.primaryColor || '#1B2B4D',
    accent: brand.accentColor || '#C9A844',
  };
}

function Stage({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      style={{
        width: '100%',
        height: '100%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #e8e4dc 0%, #f4f1ea 40%, #d9e2ec 100%)',
        fontFamily: 'ui-sans-serif, system-ui, -apple-system, Segoe UI, sans-serif',
      }}
    >
      {children}
    </div>
  );
}

function BrowserChrome({
  primary,
  urlHost,
  children,
}: {
  primary: string;
  urlHost: string;
  children: ReactNode;
}): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 1080,
        height: 700,
        borderRadius: 14,
        overflow: 'hidden',
        boxShadow: '0 28px 60px rgba(15,30,60,0.22)',
        background: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 16px',
          background: '#ece8e1',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 99, background: '#e86a5c' }} />
        <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 99, background: '#e6c35c' }} />
        <div style={{ display: 'flex', width: 12, height: 12, borderRadius: 99, background: '#5cbf7a' }} />
        <div
          style={{
            display: 'flex',
            flex: 1,
            marginLeft: 12,
            background: '#fff',
            borderRadius: 8,
            padding: '8px 14px',
            fontSize: 14,
            color: '#555',
          }}
        >
          {urlHost}
        </div>
      </div>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column', background: primary }}>
        {children}
      </div>
    </div>
  );
}

function LaptopChrome({ children }: { children: ReactNode }): ReactElement {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div
        style={{
          display: 'flex',
          width: 1040,
          height: 620,
          borderRadius: 16,
          overflow: 'hidden',
          border: '10px solid #1a1a1a',
          boxShadow: '0 24px 50px rgba(0,0,0,0.28)',
          background: '#f7f6f3',
        }}
      >
        {children}
      </div>
      <div
        style={{
          display: 'flex',
          width: 280,
          height: 18,
          background: '#2a2a2a',
          borderBottomLeftRadius: 6,
          borderBottomRightRadius: 6,
        }}
      />
      <div
        style={{
          display: 'flex',
          width: 420,
          height: 10,
          background: '#3a3a3a',
          borderRadius: 4,
          marginTop: 2,
        }}
      />
    </div>
  );
}

function PhoneChrome({ children }: { children: ReactNode }): ReactElement {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        width: 360,
        height: 700,
        borderRadius: 36,
        overflow: 'hidden',
        border: '12px solid #111',
        boxShadow: '0 28px 50px rgba(0,0,0,0.3)',
        background: '#fff',
      }}
    >
      <div
        style={{
          display: 'flex',
          justifyContent: 'center',
          paddingTop: 10,
          background: '#111',
        }}
      >
        <div
          style={{
            display: 'flex',
            width: 110,
            height: 22,
            borderRadius: 12,
            background: '#222',
          }}
        />
      </div>
      <div style={{ display: 'flex', flex: 1, flexDirection: 'column' }}>{children}</div>
    </div>
  );
}

export async function renderWebsiteConceptPng(brand: ConceptRenderBrand): Promise<Buffer> {
  const { primary, accent } = colors(brand);
  const headline = (brand.headline || brand.story || `Welcome to ${brand.clientName}`).slice(0, 64);
  const sub = (brand.tagline || brand.story || '').slice(0, 110);
  const programs =
    brand.programLabels?.slice(0, 3) ||
    brand.portalModules?.slice(0, 3) ||
    ['Programs', 'Community', 'Impact'];
  const host = `${brand.clientName.toLowerCase().replace(/[^a-z0-9]+/g, '').slice(0, 18) || 'org'}.org`;

  return toPngBuffer(
    <Stage>
      <BrowserChrome primary={primary} urlHost={`https://${host}`}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 28px',
            background: 'rgba(0,0,0,0.15)',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', fontSize: 18, fontWeight: 700 }}>{brand.clientName}</div>
          <div style={{ display: 'flex', gap: 18, fontSize: 13, opacity: 0.9 }}>
            <div style={{ display: 'flex' }}>Mission</div>
            <div style={{ display: 'flex' }}>Programs</div>
            <div style={{ display: 'flex' }}>Stories</div>
            <div
              style={{
                display: 'flex',
                background: accent,
                color: primary,
                padding: '6px 12px',
                borderRadius: 4,
                fontWeight: 700,
              }}
            >
              {brand.cta || 'Get started'}
            </div>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '36px 48px',
            background: brand.heroImageUrl
              ? `linear-gradient(115deg, ${primary}f2 0%, ${primary}99 50%, transparent 75%), url(${brand.heroImageUrl})`
              : `linear-gradient(145deg, ${primary} 0%, #0a1628 60%, ${accent}55 100%)`,
            backgroundSize: 'cover',
            color: '#fff',
          }}
        >
          <div
            style={{
              display: 'flex',
              fontSize: 13,
              letterSpacing: 3,
              textTransform: 'uppercase',
              color: accent,
              fontWeight: 700,
              marginBottom: 14,
            }}
          >
            Discover · Fall in love
          </div>
          <div
            style={{
              display: 'flex',
              fontSize: 48,
              fontWeight: 700,
              letterSpacing: -1,
              lineHeight: 1.08,
              maxWidth: 720,
            }}
          >
            {headline}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 16,
              fontSize: 20,
              lineHeight: 1.4,
              opacity: 0.92,
              maxWidth: 620,
            }}
          >
            {sub || `A clear story for the people ${brand.clientName} serves.`}
          </div>
          <div
            style={{
              display: 'flex',
              marginTop: 28,
              background: accent,
              color: primary,
              padding: '14px 26px',
              borderRadius: 4,
              fontSize: 17,
              fontWeight: 700,
              width: 'auto',
            }}
          >
            {brand.cta || 'Get started'}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            background: '#fff',
            padding: '18px 28px',
            gap: 14,
          }}
        >
          {programs.map((p) => (
            <div
              key={p}
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                padding: '14px 16px',
                borderRadius: 10,
                background: '#f7f6f3',
                color: primary,
              }}
            >
              <div style={{ display: 'flex', fontSize: 15, fontWeight: 700 }}>{p}</div>
              <div style={{ display: 'flex', fontSize: 12, color: '#666', marginTop: 4 }}>
                Real programs · real proof
              </div>
            </div>
          ))}
        </div>
      </BrowserChrome>
    </Stage>,
  );
}

export async function renderPortalConceptPng(brand: ConceptRenderBrand): Promise<Buffer> {
  const { primary, accent } = colors(brand);
  const nav =
    brand.portalModules?.length && brand.portalModules.length >= 4
      ? brand.portalModules.slice(0, 7)
      : ['Programs', 'Events', 'Messages', 'Reports', 'Tasks', 'Care'];
  const activity = [
    { t: 'Today', v: `${Math.max(3, Math.round(brand.score / 12))} follow-ups` },
    { t: nav[0], v: 'On track' },
    { t: 'Capacity', v: brand.opportunityLabel },
  ];

  return toPngBuffer(
    <Stage>
      <LaptopChrome>
        <div style={{ display: 'flex', flex: 1 }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              width: 220,
              background: primary,
              padding: '22px 14px',
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', fontSize: 17, fontWeight: 700, marginBottom: 4 }}>
              {brand.clientName}
            </div>
            <div
              style={{
                display: 'flex',
                fontSize: 11,
                color: accent,
                marginBottom: 20,
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Leadership workspace
            </div>
            {nav.map((item, i) => (
              <div
                key={item}
                style={{
                  display: 'flex',
                  padding: '10px 12px',
                  marginBottom: 5,
                  borderRadius: 8,
                  background: i === 0 ? accent : 'transparent',
                  color: i === 0 ? primary : 'rgba(255,255,255,0.9)',
                  fontSize: 14,
                  fontWeight: i === 0 ? 700 : 500,
                }}
              >
                {item}
              </div>
            ))}
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
              padding: 28,
              background: '#f4f2ed',
            }}
          >
            <div style={{ display: 'flex', fontSize: 28, fontWeight: 700, color: primary }}>
              Good morning
            </div>
            <div style={{ display: 'flex', fontSize: 15, color: '#555', marginTop: 4 }}>
              Today across {brand.clientName} — {nav.slice(0, 3).join(' · ')}
            </div>
            <div style={{ display: 'flex', marginTop: 20 }}>
              {activity.map((card) => (
                <div
                  key={card.t}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    background: '#fff',
                    borderRadius: 12,
                    padding: 16,
                    marginRight: 12,
                    width: 220,
                    boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
                  }}
                >
                  <div style={{ display: 'flex', fontSize: 11, color: '#888', letterSpacing: 1 }}>
                    {card.t}
                  </div>
                  <div
                    style={{
                      display: 'flex',
                      fontSize: 20,
                      fontWeight: 700,
                      marginTop: 6,
                      color: primary,
                    }}
                  >
                    {card.v}
                  </div>
                </div>
              ))}
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                marginTop: 16,
                background: '#fff',
                borderRadius: 12,
                padding: 20,
                flex: 1,
                boxShadow: '0 6px 18px rgba(0,0,0,0.05)',
              }}
            >
              <div style={{ display: 'flex', fontSize: 18, fontWeight: 700, color: primary }}>
                {nav[0]} · live activity
              </div>
              <div style={{ display: 'flex', fontSize: 14, color: '#666', marginTop: 8, lineHeight: 1.45 }}>
                Leadership runs {brand.clientName} from one alive workspace — not a generic admin
                template.
              </div>
              <div
                style={{
                  display: 'flex',
                  marginTop: 16,
                  height: 80,
                  borderRadius: 10,
                  background: `linear-gradient(90deg, ${primary}22, ${accent}44)`,
                }}
              />
            </div>
          </div>
        </div>
      </LaptopChrome>
    </Stage>,
  );
}

export async function renderMemberConceptPng(brand: ConceptRenderBrand): Promise<Buffer> {
  const { primary, accent } = colors(brand);
  const persona = brand.memberPersona || 'Member';
  const tiles =
    brand.memberTiles?.length && brand.memberTiles.length >= 4
      ? brand.memberTiles.slice(0, 4)
      : ['Messages', 'Upcoming Events', 'Resources', 'Progress'];

  return toPngBuffer(
    <Stage>
      <PhoneChrome>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            background: '#f7f6f3',
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: '20px 18px 16px',
              background: primary,
              color: '#fff',
            }}
          >
            <div style={{ display: 'flex', fontSize: 12, opacity: 0.8, letterSpacing: 1 }}>
              {brand.clientName}
            </div>
            <div style={{ display: 'flex', fontSize: 24, fontWeight: 700, marginTop: 6 }}>
              Welcome back
            </div>
            <div style={{ display: 'flex', fontSize: 13, opacity: 0.9, marginTop: 4 }}>
              Your {persona.toLowerCase()} home
            </div>
          </div>
          {brand.heroImageUrl ? (
            <img
              src={brand.heroImageUrl}
              alt=""
              width={336}
              height={120}
              style={{
                width: 336,
                height: 120,
                objectFit: 'cover',
                margin: '12px 12px 0',
                borderRadius: 12,
              }}
            />
          ) : (
            <div
              style={{
                display: 'flex',
                margin: '12px 12px 0',
                height: 100,
                borderRadius: 12,
                background: `linear-gradient(135deg, ${primary}, ${accent})`,
                alignItems: 'flex-end',
                padding: 14,
                color: '#fff',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Stay connected with {brand.clientName}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              padding: 12,
              justifyContent: 'space-between',
            }}
          >
            {tiles.map((tile) => (
              <div
                key={tile}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: 154,
                  background: '#fff',
                  borderRadius: 12,
                  padding: 12,
                  marginBottom: 10,
                  boxShadow: '0 4px 12px rgba(0,0,0,0.05)',
                }}
              >
                <div style={{ display: 'flex', fontSize: 14, fontWeight: 700, color: primary }}>
                  {tile}
                </div>
                <div style={{ display: 'flex', fontSize: 11, color: '#777', marginTop: 4 }}>
                  For {persona.toLowerCase()}s
                </div>
                <div
                  style={{
                    display: 'flex',
                    marginTop: 10,
                    height: 5,
                    borderRadius: 99,
                    background: `${accent}66`,
                    width: '50%',
                  }}
                />
              </div>
            ))}
          </div>
        </div>
      </PhoneChrome>
    </Stage>,
  );
}

export async function renderAllConceptPngs(brand: ConceptRenderBrand): Promise<{
  landing: Buffer;
  portal: Buffer;
  member: Buffer;
}> {
  const [landing, portal, member] = await Promise.all([
    renderWebsiteConceptPng(brand),
    renderPortalConceptPng(brand),
    renderMemberConceptPng(brand),
  ]);
  return { landing, portal, member };
}

/** Back-compat names used by older imports */
export const renderAppleLandingPng = renderWebsiteConceptPng;
export const renderApplePortalPng = renderPortalConceptPng;
export const renderAppleMemberPng = renderMemberConceptPng;
export const renderAllAppleMockupPngs = renderAllConceptPngs;
