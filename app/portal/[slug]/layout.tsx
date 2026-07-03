import EAGuideOrb from '@/app/components/ea-guide/EAGuideOrb';

export default function PortalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <EAGuideOrb />
    </>
  );
}
