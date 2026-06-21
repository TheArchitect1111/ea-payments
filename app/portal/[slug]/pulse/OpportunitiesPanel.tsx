import Link from 'next/link';
import { getPortalCaptures } from '@/lib/capture-records';
import { NAVY, GOLD } from '@/lib/chassis/PortalShell';

export default async function OpportunitiesPanel({ slug }: { slug: string }) {
  const captures = await getPortalCaptures(slug, 8);
  const opportunities = captures.filter(
    (c) => c.considerSlug || c.shareUrl || c.blueprintSummary || c.analysisSummary,
  );

  if (opportunities.length === 0) {
    return (
      <div className="ep-card">
        <p className="ep-card-title">Pulse → Opportunities</p>
        <p className="ep-placeholder-text">
          No opportunity experiences yet. Capture one in{' '}
          <Link href={`/portal/${slug}/simplifi`} className="underline" style={{ color: GOLD }}>
            Simplifi™
          </Link>{' '}
          to generate a shareable Consider link.
        </p>
      </div>
    );
  }

  return (
    <div className="ep-card overflow-x-auto">
      <p className="ep-card-title">Pulse → Opportunities</p>
      <p className="ep-placeholder-text mb-4">
        Simplifi captures, Magnifi narratives, and share links — visible from Pulse.
      </p>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-neutral-200">
            {['Prospect', 'Scores', 'Status', 'Links'].map((head) => (
              <th
                key={head}
                className="px-2 py-2 text-left text-xs font-bold uppercase tracking-wider text-neutral-500"
              >
                {head}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {opportunities.map((capture) => (
            <tr key={capture.id} className="border-b border-neutral-100">
              <td className="px-2 py-3">
                <p className="font-semibold" style={{ color: NAVY }}>
                  {capture.prospectName || capture.businessName || capture.title}
                </p>
                <p className="text-xs text-neutral-400">{capture.dateCaptured}</p>
              </td>
              <td className="px-2 py-3 text-xs">
                Vis {capture.visibilityScore ?? '—'} · Conv {capture.conversionScore ?? '—'}
              </td>
              <td className="px-2 py-3 text-xs text-neutral-600">
                {capture.prospectStatus ?? capture.status}
              </td>
              <td className="px-2 py-3">
                <div className="flex flex-col gap-1">
                  {(capture.shareUrl || capture.considerSlug) && (
                    <a
                      href={capture.shareUrl ?? `/consider/${capture.considerSlug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-bold underline"
                      style={{ color: GOLD }}
                    >
                      Consider
                    </a>
                  )}
                  <a
                    href={`/magnifi/${capture.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-bold underline"
                    style={{ color: GOLD }}
                  >
                    Magnifi
                  </a>
                  <Link
                    href={`/portal/${slug}/simplifi`}
                    className="text-xs font-bold underline"
                    style={{ color: GOLD }}
                  >
                    Simplifi
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
