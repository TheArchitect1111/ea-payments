import EANavigatorShell from './_components/EANavigatorShell';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return <EANavigatorShell>{children}</EANavigatorShell>;
}
