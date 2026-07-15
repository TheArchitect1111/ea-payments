import AdminWorkspaceShell from './_components/AdminWorkspaceShell';
import GuidedTour from './_components/GuidedTour';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminWorkspaceShell>
      <GuidedTour />
      {children}
    </AdminWorkspaceShell>
  );
}
