import Link from 'next/link';
import Image from 'next/image';

export default function AmplifiBrand({ href = '/amplifi', light = false }: { href?: string; light?: boolean }) {
  return (
    <Link href={href} className={`am-brand${light ? ' am-brand-light' : ''}`} aria-label="Amplifi home">
      <Image
        className="am-brand-logo"
        src="/amplifi/amplifi-logo-premium.png"
        alt="Amplifi by Efficiency Architects"
        width={1973}
        height={797}
        priority
      />
    </Link>
  );
}
