export const AMANDA_OFFERS = [
  { courseId: 'body-sculpt-certification', name: 'Body Sculpt Certification', priceCad: 2497, audience: 'certified-practitioner' as const },
  { courseId: 'advanced-body-sculpt', name: 'Advanced Body Sculpt', priceCad: 1997, audience: 'certified-practitioner' as const },
  { courseId: 'the-entrepreneurial-artist', name: 'The Entrepreneurial Artist', priceCad: 497, audience: 'student-trainee' as const },
  { courseId: 'foundry-mentorship', name: 'Foundry Mentorship', priceCad: 3500, audience: 'certified-practitioner' as const },
  { courseId: 'lifeline-live', name: 'LIFELINE LIVE', priceCad: 297, audience: 'student-trainee' as const },
] as const;

export const AMANDA_PORTAL_FORMS = [
  { id: 'general-consultation', title: 'General Consultation', audience: 'certified-practitioner' as const },
  { id: 'certification-application', title: 'Certification Application', audience: 'certified-practitioner' as const },
  { id: 'foundry-application', title: 'Foundry Application', audience: 'certified-practitioner' as const },
  { id: 'speaking-media-inquiry', title: 'Speaking and Media Inquiry', audience: 'certified-practitioner' as const },
  { id: 'student-enrollment', title: 'Student Enrollment', audience: 'student-trainee' as const },
  { id: 'lifeline-live-application', title: 'LIFELINE LIVE Guest Application', audience: 'student-trainee' as const },
] as const;

export const AMANDA_PRACTITIONER = { kitId: 'practitioner-kit', priceCad: 499 };
