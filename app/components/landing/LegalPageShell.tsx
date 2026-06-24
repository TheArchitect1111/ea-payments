import type { ReactNode } from 'react';
import Link from 'next/link';
import '../../landing.css';

export default function LegalPageShell({
  title,
  kicker,
  children,
}: {
  title: string;
  kicker?: string;
  children: ReactNode;
}) {
  return (
    <main className="pl-site pl-legal-page">
      <header className="pl-nav pl-nav-light">
        <Link href="/" className="pl-brand" aria-label="Efficiency Architects home">
          <span>Efficiency Architects</span>
        </Link>
        <Link href="/contact" className="pl-nav-link">
          Contact
        </Link>
      </header>
      <article className="pl-legal-shell">
        {kicker ? <p className="pl-kicker">{kicker}</p> : null}
        <h1>{title}</h1>
        <div className="pl-legal-body">{children}</div>
        <p className="pl-legal-back">
          <Link href="/">← Back to home</Link>
        </p>
      </article>
    </main>
  );
}
