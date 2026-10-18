import type { HelpEntry } from './manifest-loader';

export type GuideRole = 'student' | 'admin' | 'owner';
const studentGroups = new Set(['publicCourseCatalog', 'studentLearningControls']);
const studentRoleIds = new Set(['courses', 'advanced-training', 'assignments-and-assessments', 'progress', 'certification', 'certificates']);
const studentPublicDestinations = new Set(['#learn', '#classes-grid']);

export function normalizeGuideRole(role: string | null | undefined): GuideRole {
  return role === 'owner' ? 'owner' : role === 'admin' || role === 'staff' ? 'admin' : 'student';
}
export function canReadEntry(entry: HelpEntry, role: GuideRole): boolean {
  if (role === 'owner') return true;
  if (role === 'admin') {
    return entry.group !== 'ownerOperationalControls' ||
      Boolean(entry.raw.section || entry.raw.control);
  }
  if (studentGroups.has(entry.group)) return true;
  if (entry.group === 'roleDashboardNavigation') {
    return entry.audience === 'student-trainee' && studentRoleIds.has(String(entry.raw.id || ''));
  }
  if (entry.group === 'publicPrimary' || entry.group === 'publicCallToActions') {
    return studentPublicDestinations.has(entry.href || '');
  }
  return false;
}
