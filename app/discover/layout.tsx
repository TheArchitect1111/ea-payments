import EAGuideOrb from '@/app/components/ea-guide/EAGuideOrb';

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <EAGuideOrb />
    </>
  );
}
