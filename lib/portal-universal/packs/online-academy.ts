import type { IndustryPack } from '@/lib/portal-universal/industry-pack';

/**
 * Reusable EA chassis option for teachers, coaches, trainers, and certification programs.
 * Tenant-specific branding, course data, prices, and certificate artwork are supplied at launch.
 */
export const ONLINE_ACADEMY_PACK: IndustryPack = {
  id: 'online-academy-student-portal',
  version: '1.0.0',
  title: 'Online Academy + Student Portal',
  description:
    'Public course enrollment connected to a branded, role-aware learning portal and teacher operations dashboard.',
  presentation: 'workspace',
  suggestedModuleIds: [
    'dashboard',
    'member',
    'landing',
    'training',
    'resources',
    'billing',
    'people',
    'applications',
    'reports',
    'messaging',
    'settings',
  ],
  useClientExperienceChrome: false,
  nav: [
    {
      id: 'home',
      universalCapabilityId: 'home',
      label: 'Student Home',
      order: 10,
      preferredModuleId: 'member',
    },
    {
      id: 'courses',
      universalCapabilityId: 'resources',
      label: 'Courses & Learning',
      order: 20,
      preferredModuleId: 'training',
    },
    {
      id: 'resources',
      universalCapabilityId: 'resources',
      label: 'Resources',
      order: 30,
      preferredModuleId: 'resources',
    },
    {
      id: 'messages',
      universalCapabilityId: 'messages',
      label: 'Messages',
      order: 40,
      preferredModuleId: 'messaging',
    },
    {
      id: 'payments',
      universalCapabilityId: 'payments',
      label: 'Payments',
      order: 50,
      preferredModuleId: 'billing',
    },
    {
      id: 'students',
      universalCapabilityId: 'people',
      label: 'Students',
      order: 60,
      preferredModuleId: 'people',
      minRole: 'staff',
    },
    {
      id: 'enrollments',
      universalCapabilityId: 'programs',
      label: 'Enrollments',
      order: 70,
      preferredModuleId: 'applications',
      minRole: 'staff',
    },
    {
      id: 'reports',
      universalCapabilityId: 'resources',
      label: 'Progress & Revenue',
      order: 80,
      preferredModuleId: 'reports',
      minRole: 'staff',
    },
    {
      id: 'academy-settings',
      universalCapabilityId: 'messages',
      label: 'Academy Settings',
      order: 90,
      preferredModuleId: 'settings',
      minRole: 'admin',
    },
  ],
  branding: {
    personalityId: 'training-learning',
    workspaceName: 'Online Academy',
    brandName: 'Academy',
    terminology: {
      members: 'Students',
      home: 'Student Home',
      startPrompt: 'Continue learning',
      focus: 'Your next lesson',
      attention: 'Needs your attention',
      start: 'Continue course',
    },
  },
  extensions: {
    people: { enabled: false },
    tasks: { enabled: false },
    notifications: { enabled: false },
    formSchemaRefs: [
      {
        id: 'academy-course-enrollment',
        universalCapabilityId: 'programs',
        title: 'Course Enrollment',
        schemaRef: 'ea://academy/forms/course-enrollment/v1',
      },
    ],
    workflowRefs: [
      {
        id: 'academy-public-course-cta',
        purpose: 'Connect the public Courses & Learning CTA to the branded course catalog.',
        providerHint: 'pulse',
        envKeyOrSlug: 'academy-public-course-cta',
      },
      {
        id: 'academy-payment-and-access',
        purpose: 'Confirm payment, create student access automatically, and assign purchased courses.',
        providerHint: 'pulse',
        envKeyOrSlug: 'academy-payment-and-access',
      },
      {
        id: 'academy-welcome-and-sign-in',
        purpose: 'Send the branded welcome message and secure student sign-in instructions.',
        providerHint: 'pulse',
        envKeyOrSlug: 'academy-welcome-and-sign-in',
      },
      {
        id: 'academy-progress-and-certificate',
        purpose: 'Track lesson completion and release the branded certificate when requirements are met.',
        providerHint: 'pulse',
        envKeyOrSlug: 'academy-progress-and-certificate',
      },
    ],
    nba: {
      providerId: 'online-academy',
      staticHeadline: 'Continue with your next lesson.',
    },
  },
};
