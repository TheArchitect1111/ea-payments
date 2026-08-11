import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Accessibility — Efficiency Architects',
  description: 'Accessibility statement for Efficiency Architects and Amplifi.',
};

export default function AccessibilityPage() {
  return (
    <main className="min-h-screen bg-[#f8f5ee] px-6 py-16 text-[#171717]">
      <article className="mx-auto max-w-3xl">
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#9a741d]">Efficiency Architects</p>
        <h1 className="mt-3 text-4xl font-semibold tracking-tight sm:text-5xl">Accessibility</h1>
        <p className="mt-6 text-lg leading-8 text-neutral-600">
          We want Efficiency Architects and Amplifi to be usable by as many people as possible. We work to make our
          digital experiences clear, navigable, readable, and compatible with common assistive technologies.
        </p>

        <section className="mt-10 border-t border-[#ddd6c7] pt-8">
          <h2 className="text-2xl font-semibold">What we work toward</h2>
          <p className="mt-4 leading-7 text-neutral-600">
            Our ongoing work includes keyboard access, useful page structure and labels, readable contrast, meaningful
            text alternatives for important images, responsive layouts, and controls that remain practical on phones,
            tablets, and larger screens.
          </p>
        </section>

        <section className="mt-10 border-t border-[#ddd6c7] pt-8">
          <h2 className="text-2xl font-semibold">Need help using something?</h2>
          <p className="mt-4 leading-7 text-neutral-600">
            If you encounter an accessibility barrier, tell us what page or feature you were using and what happened.
            We will use that information to help you and to improve the experience where we can.
          </p>
          <Link
            href="/contact"
            className="mt-6 inline-flex rounded-full bg-[#17233d] px-6 py-3 text-sm font-semibold text-white"
          >
            Contact Efficiency Architects
          </Link>
        </section>

        <p className="mt-12 text-sm leading-6 text-neutral-500">
          Accessibility is an ongoing practice, not a one-time claim. This statement describes our approach and should
          not be read as a guarantee that every third-party service or every page is free of accessibility issues.
        </p>
      </article>
    </main>
  );
}
