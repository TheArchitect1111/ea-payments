import EANavigatorShell from './_components/EANavigatorShell';
import GuidedTour from './_components/GuidedTour';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <EANavigatorShell>
      <GuidedTour />
      {children}
    </EANavigatorShell>
  );
}
