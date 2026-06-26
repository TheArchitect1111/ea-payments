import AdminLogin from '../../master/AdminLogin';
import { hasAdminPageAccess } from '@/lib/admin-page-auth';
import ProjectGeneratorClient from './ProjectGeneratorClient';

export const dynamic = 'force-dynamic';

export default async function ProjectGeneratorPage() {
  if (!(await hasAdminPageAccess())) return <AdminLogin />;
  return <ProjectGeneratorClient />;
}
