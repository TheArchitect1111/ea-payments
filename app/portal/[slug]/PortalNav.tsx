import Link from 'next/link';

const NAVY = '#1B2B4D';
const GOLD = '#C9A844';

export function PortalNav({
  slug,
  active,
}: {
  slug: string;
  active: 'home' | 'pulse' | 'simplifi' | 'updates';
}) {
  const brandName = process.env.BRAND_NAME ?? 'Efficiency Architects';

  return (
    <header className="ep-header">
      <div className="ep-header-brand">
        <span className="ep-header-label">Client Portal</span>
        <span className="ep-header-name">{brandName}</span>
      </div>
      <div className="ep-header-actions">
        <Link
          href={`/portal/${slug}/simplifi`}
          className="ep-update-link"
          style={active === 'simplifi' ? { outline: '2px solid #fff' } : undefined}
        >
          Simplifi
        </Link>
        <Link
          href={`/portal/${slug}/pulse`}
          className="ep-update-link"
          style={active === 'pulse' ? { outline: '2px solid #fff' } : undefined}
        >
          Pulse
        </Link>
        <Link
          href={`/portal/${slug}/updates`}
          className="ep-update-link"
          style={
            active === 'updates'
              ? { outline: '2px solid #fff', background: '#fff', color: NAVY }
              : undefined
          }
        >
          Update Requests
        </Link>
        {active !== 'home' && (
          <Link href={`/portal/${slug}`} className="ep-logout">
            Home
          </Link>
        )}
        <a href="/api/portal/logout" className="ep-logout">
          Sign Out
        </a>
      </div>
    </header>
  );
}

export { NAVY, GOLD };
