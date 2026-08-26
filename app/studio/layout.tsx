import Link from 'next/link';

export default function StudioLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <>
      {children}
      <Link
        href="/studio/websites"
        className="fixed bottom-5 right-5 z-[100] rounded-full bg-black px-5 py-3 text-xs font-semibold text-white shadow-2xl transition-transform hover:scale-[1.03]"
      >
        Website Builder →
      </Link>
    </>
  );
}
