import Link from 'next/link';

export default function AmplifiBrand({ href = '/amplifi', light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`am-brand${light ? ' am-brand-light' : ''}`} aria-label="Amplifi home">
      <span className="am-brand-mark" aria-hidden="true"><span>A</span></span>
      <span className="am-brand-name">amplifi</span>
      <span className="am-brand-by">by Efficiency Architects</span>
    </Link>
  );
}
