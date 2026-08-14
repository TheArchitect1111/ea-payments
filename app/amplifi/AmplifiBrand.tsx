import Link from 'next/link';
import Image from 'next/image';

export default function AmplifiBrand({ href = '/amplifi', light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`am-brand${light ? ' am-brand-light' : ''}`} aria-label="Amplifi home">
      <Image
        className="am-brand-logo"
        src={light ? '/amplifi/amplifi-logo-dark.png' : '/amplifi/amplifi-logo-horizontal.png'}
        alt="Amplifi by Efficiency Architects"
        width={light ? 800 : 900}
        height={light ? 559 : 259}
        priority
      />
    </Link>
  );
}
