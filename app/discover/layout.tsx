import DiscoverGuide from './DiscoverGuide';

export default function DiscoverLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <DiscoverGuide />
    </>
  );
}
