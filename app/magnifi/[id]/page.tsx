import Link from 'next/link';
import { getCaptureByIdentifier } from '@/lib/capture-records';
import { isMagnifiCaptureRetired, MAGNIFI_PUBLIC_LINK_WARNING } from '@/lib/amplifi-share-policy';
import { buildMagnifiExperience } from '@/lib/magnifi-experience-engine';
import MagnifiExperienceV2 from './MagnifiExperienceV2';
import MagnifiClassicReport from './MagnifiClassicReport';

export const dynamic = 'force-dynamic';

function MagnifiUnavailable({ retired = false }: { retired?: boolean }) {
  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.25rem',
        background: 'linear-gradient(165deg, #0f1829 0%, #1B2B4D 55%, #243a66 100%)',
        color: '#FAF8F3',
        fontFamily: 'Georgia, "Times New Roman", serif',
      }}
    >
      <div style={{ maxWidth: 28 * 16, textAlign: 'center' }}>
        <p
          style={{
            margin: '0 0 0.75rem',
            fontSize: '0.72rem',
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'rgba(201, 168, 68, 0.9)',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Magnifi
        </p>
        <h1 style={{ margin: '0 0 0.85rem', fontSize: '1.85rem', fontWeight: 550 }}>
          {retired ? 'Story retired' : 'Story unavailable'}
        </h1>
        <p
          style={{
            margin: '0 0 1.75rem',
            lineHeight: 1.65,
            color: 'rgba(250, 248, 243, 0.78)',
            fontFamily: 'system-ui, sans-serif',
            fontSize: '0.98rem',
          }}
        >
          {retired
            ? 'This Magnifi story was archived and is no longer shared. Capture a new opportunity in Simplifi if you need a fresh story.'
            : 'This Magnifi story could not be found. It may have been removed, or the capture did not finish saving. Capture once more from Simplifi to create a new story.'}
        </p>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.75rem',
            justifyContent: 'center',
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          <Link
            href="/simplifi/workspace"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.25rem',
              borderRadius: 999,
              background: '#C9A844',
              color: '#1B2B4D',
              fontWeight: 700,
              textDecoration: 'none',
              fontSize: '0.88rem',
            }}
          >
            Open Simplifi workspace
          </Link>
          <Link
            href="/simplifi/capture"
            style={{
              display: 'inline-block',
              padding: '0.75rem 1.25rem',
              borderRadius: 999,
              border: '1px solid rgba(250, 248, 243, 0.35)',
              color: '#FAF8F3',
              fontWeight: 600,
              textDecoration: 'none',
              fontSize: '0.88rem',
            }}
          >
            Capture an opportunity
          </Link>
        </div>
      </div>
    </main>
  );
}

export default async function MagnifiOpportunityPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ classic?: string }>;
}) {
  const { id } = await params;
  const { classic } = await searchParams;
  const capture = await getCaptureByIdentifier(id);

  if (!capture) {
    return <MagnifiUnavailable />;
  }

  if (isMagnifiCaptureRetired(capture.status)) {
    return <MagnifiUnavailable retired />;
  }

  if (classic === '1') {
    return <MagnifiClassicReport capture={capture} />;
  }

  const experience = buildMagnifiExperience(capture);
  return <MagnifiExperienceV2 experience={experience} publicLinkWarning={MAGNIFI_PUBLIC_LINK_WARNING} />;
}
