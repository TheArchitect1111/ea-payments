export type AmandaCourseResource = {
  id: string;
  courseId: string;
  title: string;
  description: string;
  pathname: string;
  fileType: 'PDF' | 'DOCX';
};

export const AMANDA_COURSE_RESOURCES: readonly AmandaCourseResource[] = [
  {
    id: 'body-sculpt-textbook',
    courseId: 'body-sculpt-practitioner-certification',
    title: 'Body Sculpt Textbook',
    description: 'Core reference textbook for the certification program.',
    pathname: 'AesthetiKine Body Sculpt Textbook.pdf',
    fileType: 'PDF',
  },
  {
    id: 'body-sculpt-practitioner-manual',
    courseId: 'body-sculpt-practitioner-certification',
    title: 'Body Sculpt Practitioner Manual',
    description: 'Practitioner manual for instruction and clinical reference.',
    pathname: 'AesthetiKine_Body_Sculpt_Practitioner_Manual.docx',
    fileType: 'DOCX',
  },
  {
    id: 'body-sculpt-client-forms',
    courseId: 'body-sculpt-practitioner-certification',
    title: 'Body Sculpt Client Forms',
    description: 'Designed client forms for use during consultations and treatment.',
    pathname: 'AesthetiKine_Body_Sculpt_Client_Forms_Designed.pdf',
    fileType: 'PDF',
  },
  {
    id: 'body-sculpt-timed-protocol',
    courseId: 'body-sculpt-practitioner-certification',
    title: 'Body Sculpt Timed Protocol',
    description: 'Timed sequence for consistent Body Sculpt sessions.',
    pathname: 'AesthetiKine_Body_Sculpt_Timed_Protocol.pdf',
    fileType: 'PDF',
  },
  {
    id: 'practitioner-intake-consultation-protocol',
    courseId: 'body-sculpt-practitioner-certification',
    title: 'Practitioner Intake & Consultation Protocol',
    description: 'Printable intake and consultation workflow.',
    pathname: 'AesthetiKine_Practitioner_Intake_Consultation_Protocol_PRINT.pdf',
    fileType: 'PDF',
  },
  {
    id: 'practitioner-treatment-plan',
    courseId: 'body-sculpt-practitioner-certification',
    title: 'Practitioner Treatment Plan',
    description: 'Treatment planning worksheet for practitioner use.',
    pathname: 'AesthetiKine_Practitioner_Treatment_Plan.pdf',
    fileType: 'PDF',
  },
  {
    id: 'client-take-home-plan',
    courseId: 'body-sculpt-practitioner-certification',
    title: 'Client Take-Home Plan',
    description: 'Client-facing aftercare and take-home guidance.',
    pathname: 'AesthetiKine_Client_Take_Home_Plan.pdf',
    fileType: 'PDF',
  },
  {
    id: 'recommended-home-exercises',
    courseId: 'body-sculpt-practitioner-certification',
    title: 'Recommended Home Exercises',
    description: 'Supporting exercises clients can complete between sessions.',
    pathname: 'AesthetiKine_Recommended_Home_Exercises.pdf',
    fileType: 'PDF',
  },
] as const;

export function resourcesForAmandaCourse(courseId: string) {
  return AMANDA_COURSE_RESOURCES.filter((resource) => resource.courseId === courseId);
}

export function findAmandaCourseResource(resourceId: string) {
  return AMANDA_COURSE_RESOURCES.find((resource) => resource.id === resourceId);
}
