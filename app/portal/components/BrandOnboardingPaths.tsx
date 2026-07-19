'use client';

import { useEffect, useState, type FormEvent, type ReactNode } from 'react';
import { Fraunces, Manrope } from 'next/font/google';
import './brand-onboarding-paths.css';

const display = Fraunces({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
});

const sans = Manrope({
  subsets: ['latin'],
  weight: ['500', '600', '700', '800'],
});

export type BrandOnboardingPath =
  | 'existing_brand'
  | 'brand_discovery'
  | 'inspiration'
  | 'creative_freedom';

type Props = {
  slug: string;
  studio: ReactNode;
  businessName?: string;
  onPathComplete: () => void;
};

const STORAGE_KEY = (slug: string) => `ctp-brand-onboarding:${slug}`;
const INSPIRATION_KEY = (slug: string) => `ctp-brand-inspiration:${slug}`;
const DISCOVERY_KEY = (slug: string) => `ctp-brand-discovery:${slug}`;

const PATH_CARDS: {
  value: BrandOnboardingPath;
  title: string;
  sentence: string;
  cta: string;
  src: string;
  alt: string;
}[] = [
  {
    value: 'existing_brand',
    title: 'I Already Have My Brand',
    sentence: 'Upload logos, colors, fonts, and assets so we can build on what you already own.',
    cta: 'Upload My Brand',
    src: '/client-experience/story-brand-process.png',
    alt: 'Brand and creative process collage',
  },
  {
    value: 'brand_discovery',
    title: 'We Need Help Creating Our Brand',
    sentence: 'Answer a few short questions and we will shape a brand direction with you.',
    cta: 'Start Brand Discovery',
    src: '/client-experience/communication-understood.png',
    alt: 'Attentive conversation where someone feels understood',
  },
  {
    value: 'inspiration',
    title: 'Inspire Me',
    sentence: 'Browse styles and mark favorites — we will use your taste as creative direction.',
    cta: 'Explore Inspiration',
    src: '/client-experience/first-impression-entrance.png',
    alt: 'Warm entrance that invites a strong first impression',
  },
  {
    value: 'creative_freedom',
    title: 'Surprise Us',
    sentence: 'Trust our creative team to lead with what we have already learned about you.',
    cta: 'Trust Your Creativity',
    src: '/client-experience/begin-life-freedom.png',
    alt: 'Collage of life, freedom, and purposeful living',
  },
];

const INSPIRATION_GROUPS: { key: string; label: string; options: string[] }[] = [
  {
    key: 'website_styles',
    label: 'Website styles',
    options: ['Editorial & calm', 'Bold & modern', 'Warm hospitality', 'Clean minimal', 'Story-driven', 'Luxury quiet'],
  },
  {
    key: 'photography_styles',
    label: 'Photography styles',
    options: ['Natural light', 'Documentary', 'Portrait-forward', 'Lifestyle', 'Architectural', 'Soft film'],
  },
  {
    key: 'typography',
    label: 'Typography',
    options: ['Classic serif', 'Modern sans', 'Humanist mix', 'Elegant display', 'Friendly rounded', 'Sharp contrast'],
  },
  {
    key: 'color_palettes',
    label: 'Color palettes',
    options: ['Navy & gold', 'Warm neutrals', 'Forest & cream', 'Ocean blues', 'Soft blush', 'Charcoal & white'],
  },
  {
    key: 'brand_personalities',
    label: 'Brand personalities',
    options: ['Trusted guide', 'Warm host', 'Quiet expert', 'Bold pioneer', 'Community builder', 'Refined craftsman'],
  },
];

type DiscoveryAnswers = {
  org_name: string;
  what_you_do: string;
  who_you_help: string;
  brand_feel: string;
};

const EMPTY_DISCOVERY: DiscoveryAnswers = {
  org_name: '',
  what_you_do: '',
  who_you_help: '',
  brand_feel: '',
};

async function persistOnboarding(
  path: BrandOnboardingPath,
  answers?: Record<string, unknown>,
) {
  try {
    await fetch('/api/portal/ctp/studio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'onboarding',
        path,
        answers: answers ?? {},
      }),
    });
  } catch {
    /* localStorage is the reliable fallback */
  }
}

function PathPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);
  return (
    <div className={`bop-card-photo${failed ? ' bop-card-photo-fallback' : ''}`}>
      {!failed ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt={alt} width={800} height={520} onError={() => setFailed(true)} />
      ) : null}
    </div>
  );
}

export default function BrandOnboardingPaths({
  slug,
  studio,
  businessName,
  onPathComplete,
}: Props) {
  const [activePath, setActivePath] = useState<BrandOnboardingPath | null>(null);
  const [discovery, setDiscovery] = useState<DiscoveryAnswers>(EMPTY_DISCOVERY);
  const [discoverySaved, setDiscoverySaved] = useState(false);
  const [inspiration, setInspiration] = useState<Record<string, string[]>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Always land on the four-path chooser. Do not auto-open a prior path
    // (that was hiding "Let's Build Your Story Together" after one selection).
    setActivePath(null);
    try {
      const discRaw = window.localStorage.getItem(DISCOVERY_KEY(slug));
      if (discRaw) {
        const parsed = JSON.parse(discRaw) as Partial<DiscoveryAnswers>;
        setDiscovery({
          org_name: parsed.org_name ?? businessName ?? '',
          what_you_do: parsed.what_you_do ?? '',
          who_you_help: parsed.who_you_help ?? '',
          brand_feel: parsed.brand_feel ?? '',
        });
        if (parsed.org_name || parsed.what_you_do) setDiscoverySaved(true);
      } else if (businessName) {
        setDiscovery((prev) => ({ ...prev, org_name: businessName }));
      }

      const inspRaw = window.localStorage.getItem(INSPIRATION_KEY(slug));
      if (inspRaw) {
        setInspiration(JSON.parse(inspRaw) as Record<string, string[]>);
      }
    } catch {
      /* ignore */
    }
  }, [slug, businessName]);

  async function selectPath(path: BrandOnboardingPath) {
    setActivePath(path);
    if (path !== 'brand_discovery') setDiscoverySaved(false);
    try {
      window.localStorage.setItem(STORAGE_KEY(slug), path);
    } catch {
      /* ignore */
    }
    setSaving(true);
    await persistOnboarding(path, { brandOnboardingPath: path });
    setSaving(false);
    requestAnimationFrame(() => {
      document.getElementById('bop-path-panel')?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    });
  }

  function clearPath() {
    setActivePath(null);
    setDiscoverySaved(false);
  }

  function toggleInspiration(group: string, option: string) {
    setInspiration((prev) => {
      const current = prev[group] ?? [];
      const next = current.includes(option)
        ? current.filter((item) => item !== option)
        : [...current, option];
      const updated = { ...prev, [group]: next };
      try {
        window.localStorage.setItem(INSPIRATION_KEY(slug), JSON.stringify(updated));
      } catch {
        /* ignore */
      }
      return updated;
    });
  }

  async function submitDiscovery(e: FormEvent) {
    e.preventDefault();
    const answers = {
      brandOnboardingPath: 'brand_discovery' as const,
      org_name: discovery.org_name.trim(),
      offer_summary: discovery.what_you_do.trim(),
      what_you_do: discovery.what_you_do.trim(),
      who_you_help: discovery.who_you_help.trim(),
      brand_feel: discovery.brand_feel.trim(),
    };
    try {
      window.localStorage.setItem(DISCOVERY_KEY(slug), JSON.stringify(discovery));
      window.localStorage.setItem(STORAGE_KEY(slug), 'brand_discovery');
    } catch {
      /* ignore */
    }
    setSaving(true);
    await persistOnboarding('brand_discovery', answers);
    setSaving(false);
    setDiscoverySaved(true);
  }

  async function saveInspirationAndContinue() {
    const answers = {
      brandOnboardingPath: 'inspiration' as const,
      inspiration_prefs: inspiration,
    };
    try {
      window.localStorage.setItem(INSPIRATION_KEY(slug), JSON.stringify(inspiration));
      window.localStorage.setItem(STORAGE_KEY(slug), 'inspiration');
    } catch {
      /* ignore */
    }
    setSaving(true);
    await persistOnboarding('inspiration', answers);
    setSaving(false);
    onPathComplete();
  }

  return (
    <div className={`bop ${sans.className}`}>
      <p className="bop-kicker">Collaboration</p>
      <h2 id="cex-studio-title" className={`bop-headline ${display.className}`}>
        Let&apos;s Build Your Story Together
      </h2>
      <p className="bop-lede">
        Every organization starts from a different place. Choose the path that feels right for you.
        We&apos;ll take it from there.
      </p>

      <div className="bop-grid" role="list">
        {PATH_CARDS.map((card) => (
          <article
            key={card.value}
            className={`bop-card${activePath === card.value ? ' is-selected' : ''}`}
            role="listitem"
          >
            <PathPhoto src={card.src} alt={card.alt} />
            <div className="bop-card-body">
              <h3 className={`bop-card-title ${display.className}`}>{card.title}</h3>
              <p className="bop-card-copy">{card.sentence}</p>
              <button
                type="button"
                className="bop-card-cta"
                onClick={() => selectPath(card.value)}
                disabled={saving}
                aria-pressed={activePath === card.value}
              >
                {activePath === card.value ? 'Selected' : card.cta}
              </button>
            </div>
          </article>
        ))}
      </div>

      {activePath === 'existing_brand' ? (
        <div className="bop-panel" id="bop-path-panel">
          <button type="button" className="bop-back" onClick={clearPath}>
            Choose a different path
          </button>
          <h3 className={`bop-panel-title ${display.className}`}>Upload My Brand</h3>
          <p className="bop-panel-lede">
            Share logos, colors, fonts, and any brand assets you already have. Everything saves as
            you go.
          </p>
          <div id="cex-studio-form" className="cex-studio-form bop-studio">
            {studio}
          </div>
          <button type="button" className="bop-continue" onClick={onPathComplete}>
            Continue
          </button>
        </div>
      ) : null}

      {activePath === 'brand_discovery' ? (
        <div className="bop-panel" id="bop-path-panel">
          <button type="button" className="bop-back" onClick={clearPath}>
            Choose a different path
          </button>
          <h3 className={`bop-panel-title ${display.className}`}>Brand Discovery</h3>
          <p className="bop-panel-lede">
            Four short answers. We&apos;ll use them to start shaping your brand direction.
          </p>
          {discoverySaved ? (
            <div className="bop-success">
              <p className="bop-success-title">Thank you — we have what we need to begin.</p>
              <p className="bop-success-copy">
                We&apos;ll craft a brand direction from your answers and what we already know about
                your organization.
              </p>
              <button type="button" className="bop-continue" onClick={onPathComplete}>
                Continue
              </button>
            </div>
          ) : (
            <form className="bop-form" onSubmit={submitDiscovery}>
              <label className="bop-field">
                <span>Organization name</span>
                <input
                  required
                  value={discovery.org_name}
                  onChange={(e) => setDiscovery((d) => ({ ...d, org_name: e.target.value }))}
                  placeholder="Your organization"
                />
              </label>
              <label className="bop-field">
                <span>What do you do?</span>
                <textarea
                  required
                  rows={3}
                  value={discovery.what_you_do}
                  onChange={(e) => setDiscovery((d) => ({ ...d, what_you_do: e.target.value }))}
                  placeholder="In plain language — what you offer"
                />
              </label>
              <label className="bop-field">
                <span>Who do you help?</span>
                <textarea
                  required
                  rows={3}
                  value={discovery.who_you_help}
                  onChange={(e) => setDiscovery((d) => ({ ...d, who_you_help: e.target.value }))}
                  placeholder="The people or organizations you serve"
                />
              </label>
              <label className="bop-field">
                <span>How should people feel when they encounter your brand?</span>
                <textarea
                  required
                  rows={3}
                  value={discovery.brand_feel}
                  onChange={(e) => setDiscovery((d) => ({ ...d, brand_feel: e.target.value }))}
                  placeholder="Calm, confident, welcomed, inspired…"
                />
              </label>
              <button type="submit" className="bop-continue" disabled={saving}>
                {saving ? 'Saving…' : 'Save answers'}
              </button>
            </form>
          )}
        </div>
      ) : null}

      {activePath === 'inspiration' ? (
        <div className="bop-panel" id="bop-path-panel">
          <button type="button" className="bop-back" onClick={clearPath}>
            Choose a different path
          </button>
          <h3 className={`bop-panel-title ${display.className}`}>Inspiration Studio</h3>
          <p className="bop-panel-lede">
            Tap what resonates. Favorite as many as you like — no dense forms, just taste.
          </p>
          <div className="bop-inspire-groups">
            {INSPIRATION_GROUPS.map((group) => (
              <div key={group.key} className="bop-inspire-group">
                <h4 className="bop-inspire-label">{group.label}</h4>
                <div className="bop-tiles" role="group" aria-label={group.label}>
                  {group.options.map((option) => {
                    const selected = (inspiration[group.key] ?? []).includes(option);
                    return (
                      <button
                        key={option}
                        type="button"
                        className={`bop-tile${selected ? ' is-selected' : ''}`}
                        aria-pressed={selected}
                        onClick={() => toggleInspiration(group.key, option)}
                      >
                        <span className="bop-tile-heart" aria-hidden>
                          {selected ? '♥' : '♡'}
                        </span>
                        {option}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
          <p className="bop-inspire-note">
            We&apos;ll use your selections as creative direction when we design your experience.
          </p>
          <button
            type="button"
            className="bop-continue"
            onClick={saveInspirationAndContinue}
            disabled={saving}
          >
            {saving ? 'Saving…' : 'Continue'}
          </button>
        </div>
      ) : null}

      {activePath === 'creative_freedom' ? (
        <div className="bop-panel bop-panel-freedom" id="bop-path-panel">
          <button type="button" className="bop-back" onClick={clearPath}>
            Choose a different path
          </button>
          <h3 className={`bop-panel-title ${display.className}`}>We&apos;ve got you.</h3>
          <p className="bop-panel-lede">
            Thank you for trusting our creativity. We&apos;ll lead design direction from everything
            we&apos;ve already learned about
            {businessName ? ` ${businessName}` : ' your organization'} — and invite you in when
            it&apos;s time to review.
          </p>
          <button type="button" className="bop-continue" onClick={onPathComplete}>
            Continue
          </button>
        </div>
      ) : null}
    </div>
  );
}
