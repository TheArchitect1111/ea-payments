import Link from 'next/link';
import ContactForm from './ContactForm';
import '../landing.css';

export const metadata = {
  title: 'Contact — Efficiency Architects',
  description: 'Contact Efficiency Architects for a discovery conversation, assessment support, or partnership inquiry.',
};

export default function ContactPage() {
  return (
    <main className="pl-site pl-contact-page">
      <header className="pl-nav pl-nav-light">
        <Link href="/" className="pl-brand" aria-label="Efficiency Architects home">
          <span>Efficiency Architects</span>
        </Link>
        <Link href="/assessment" className="pl-nav-link">
          Assessment
        </Link>
      </header>
      <section className="pl-contact-shell">
        <p className="pl-kicker">Contact Us</p>
        <h1>Start with a conversation.</h1>
        <p className="pl-contact-lead">
          Whether you are ready for an Operational MRI&trade;, exploring a discovery call, or simply need clarity on
          next steps, we are here to help.
        </p>
        <div className="pl-contact-grid">
          <ContactForm />
          <aside className="pl-contact-aside">
            <h2>Other ways to connect</h2>
            <ul>
              <li>
                <strong>Discovery call</strong>
                <span>Share your context in the form and we will schedule time together.</span>
              </li>
              <li>
                <strong>Operational MRI&trade;</strong>
                <Link href="/assessment">Begin the assessment →</Link>
              </li>
              <li>
                <strong>Client stories</strong>
                <Link href="/story/selena">See a transformation story →</Link>
              </li>
            </ul>
          </aside>
        </div>
      </section>
    </main>
  );
}
