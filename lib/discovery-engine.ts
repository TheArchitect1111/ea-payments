export type DiscoveryQuestionType =
  | 'text'
  | 'email'
  | 'textarea'
  | 'multi-text'
  | 'single'
  | 'multi'
  | 'scale'
  | 'asset-select';

export type DiscoveryProject =
  | 'landing-page'
  | 'connect'
  | 'portal'
  | 'training'
  | 'operations'
  | 'communication'
  | 'automation'
  | 'events';

export type DiscoveryMultiTextValue = { selected?: string[]; note?: string };
export type DiscoveryAssetUploadValue = Record<
  string,
  {
    id: string;
    assetType: string;
    fileName: string;
    mimeType: string;
    size: number;
    url: string;
    uploadedAt: string;
  }
>;
export type DiscoveryAnswerValue =
  | string
  | string[]
  | number
  | DiscoveryMultiTextValue
  | DiscoveryAssetUploadValue
  | undefined;

export interface DiscoveryChoice {
  id: string;
  label: string;
  description?: string;
  tags?: string[];
  unlocks?: DiscoveryProject[];
}

export interface DiscoveryDisplayRule {
  questionId: string;
  includesAny?: string[];
  equals?: string;
}

export interface DiscoveryQuestion {
  id: string;
  type: DiscoveryQuestionType;
  question: string;
  helper: string;
  required?: boolean;
  maxSelections?: number;
  minSelections?: number;
  placeholder?: string;
  choices?: DiscoveryChoice[];
  displayRules?: DiscoveryDisplayRule[];
  aiPrompt?: string;
  outputMapping?: string;
  recommendationTags?: string[];
}

export interface DiscoverySection {
  id: string;
  title: string;
  intent: string;
  questions: DiscoveryQuestion[];
}

export interface DiscoverySchema {
  id: string;
  version: string;
  title: string;
  estimatedMinutes: number;
  sections: DiscoverySection[];
}

export type DiscoveryAnswers = Record<string, DiscoveryAnswerValue>;

export const DISCOVERY_SCHEMA: DiscoverySchema = {
  id: 'ea-discovery-engine',
  version: '1.0.0',
  title: 'Discover The Possibilities™',
  estimatedMinutes: 9,
  sections: [
    {
      id: 'story',
      title: 'Start Here',
      intent: 'Tell us who you are and what kind of organization you lead.',
      questions: [
        {
          id: 'organization_name',
          type: 'text',
          question: 'What is the name of your organization?',
          helper: 'This keeps the blueprint connected to the real business, team, or community we are helping.',
          required: true,
          placeholder: 'Organization or business name',
          outputMapping: 'profile.organizationName',
        },
        {
          id: 'contact_name',
          type: 'text',
          question: 'Who do I have the honor of working with?',
          helper: 'This lets us address the blueprint and next steps to the right person.',
          required: true,
          placeholder: 'First and last name',
          outputMapping: 'profile.contactName',
        },
        {
          id: 'contact_email',
          type: 'email',
          question: 'Where should we send the blueprint when it is ready?',
          helper: 'Your selections and next-step recommendations stay connected to this email.',
          required: true,
          placeholder: 'you@example.com',
          outputMapping: 'profile.email',
        },
        {
          id: 'organization_type',
          type: 'single',
          question: 'What kind of organization do you lead?',
          helper: 'Your answer changes the path so the questions fit your world instead of sending everyone through the same path.',
          required: true,
          choices: [
            { id: 'business', label: 'Business', description: 'Company, consultant, practice, or service provider' },
            { id: 'nonprofit', label: 'Nonprofit', description: 'Charity, foundation, or community organization' },
            { id: 'church', label: 'Church or ministry', description: 'Congregation, ministry, or faith-based initiative' },
            { id: 'school', label: 'School or education', description: 'School, program, academy, or training provider' },
            { id: 'sports', label: 'Sports organization', description: 'Team, league, recruiting, coaching, camps, or player development' },
            { id: 'creator', label: 'Creator or expert', description: 'Personal brand, course, coaching, or audience business' },
            { id: 'public-sector', label: 'Public sector', description: 'Municipality, agency, hospital, or public service team' },
          ],
          recommendationTags: ['segment'],
          outputMapping: 'profile.organizationType',
        },
        {
          id: 'team_size',
          type: 'single',
          question: 'How many people are on your team?',
          helper: 'This helps us recommend something that fits your team today.',
          required: true,
          choices: [
            { id: 'Just me', label: 'Just me' },
            { id: '2-5 people', label: '2-5 people' },
            { id: '6-15 people', label: '6-15 people' },
            { id: '16-50 people', label: '16-50 people' },
            { id: 'More than 50 people', label: 'More than 50 people' },
          ],
          outputMapping: 'profile.teamSizeLabel',
        },
        {
          id: 'mission',
          type: 'multi-text',
          question: 'What should people know about your work?',
          helper: 'Optional. Choose any prompts that fit, then add your own words if you want.',
          placeholder: 'Tell us anything else in your own words.',
          choices: [
            { id: 'what-we-do', label: 'What we do' },
            { id: 'who-we-serve', label: 'Who we serve' },
            { id: 'why-it-matters', label: 'Why it matters' },
            { id: 'our-offer', label: 'Our offer or service' },
            { id: 'our-audience', label: 'Our audience' },
            { id: 'our-goals', label: 'Our goals' },
            { id: 'our-story', label: 'Our story' },
            { id: 'what-makes-us-different', label: 'What makes us different' },
          ],
          outputMapping: 'profile.mission',
        },
      ],
    },
    {
      id: 'path',
      title: 'Your Path',
      intent: 'Choose the kind of support that best fits your organization.',
      questions: [
        {
          id: 'business_path',
          type: 'multi',
          question: 'As a business owner, what would help most right now?',
          helper: 'These choices help us focus on growth, sales, service, operations, or follow-up.',
          displayRules: [{ questionId: 'organization_type', equals: 'business' }],
          maxSelections: 4,
          choices: [
            { id: 'more-leads', label: 'More qualified leads' },
            { id: 'better-sales-page', label: 'A stronger sales or service page' },
            { id: 'client-portal', label: 'A better client experience' },
            { id: 'follow-up', label: 'Better follow-up' },
            { id: 'less-admin', label: 'Less admin work' },
            { id: 'premium-brand', label: 'A more premium online presence' },
          ],
        },
        {
          id: 'nonprofit_path',
          type: 'multi',
          question: 'For your nonprofit, what would help most right now?',
          helper: 'These choices help us focus on donors, volunteers, programs, reporting, and community trust.',
          displayRules: [{ questionId: 'organization_type', equals: 'nonprofit' }],
          maxSelections: 4,
          choices: [
            { id: 'donations', label: 'Increase donations' },
            { id: 'volunteers', label: 'Engage volunteers' },
            { id: 'programs', label: 'Explain programs clearly' },
            { id: 'reports', label: 'Share impact and updates' },
            { id: 'community', label: 'Build community trust' },
            { id: 'operations', label: 'Make internal work easier' },
          ],
        },
        {
          id: 'church_path',
          type: 'multi',
          question: 'For your church or ministry, what would help most right now?',
          helper: 'These choices help us focus on members, visitors, volunteers, events, giving, and care.',
          displayRules: [{ questionId: 'organization_type', equals: 'church' }],
          maxSelections: 4,
          choices: [
            { id: 'visitors', label: 'Help visitors take a next step' },
            { id: 'members', label: 'Serve members better' },
            { id: 'volunteers', label: 'Coordinate volunteers' },
            { id: 'events', label: 'Support events and groups' },
            { id: 'giving', label: 'Make giving easier' },
            { id: 'resources', label: 'Organize messages and resources' },
          ],
        },
        {
          id: 'school_path',
          type: 'multi',
          question: 'For your school or education program, what would help most right now?',
          helper: 'These choices help us focus on families, students, enrollment, learning, updates, and resources.',
          displayRules: [{ questionId: 'organization_type', equals: 'school' }],
          maxSelections: 4,
          choices: [
            { id: 'enrollment', label: 'Support enrollment' },
            { id: 'families', label: 'Communicate with families' },
            { id: 'student-resources', label: 'Organize student resources' },
            { id: 'training', label: 'Deliver lessons or training' },
            { id: 'events', label: 'Manage events or schedules' },
            { id: 'staff-workflow', label: 'Make staff work easier' },
          ],
        },
        {
          id: 'sports_path',
          type: 'multi',
          question: 'For your sports organization, what would help most right now?',
          helper: 'These choices help us focus on athletes, families, coaches, recruiting, events, and communication.',
          displayRules: [{ questionId: 'organization_type', equals: 'sports' }],
          maxSelections: 4,
          choices: [
            { id: 'athlete-profiles', label: 'Athlete or team profiles' },
            { id: 'recruiting', label: 'Recruiting visibility' },
            { id: 'families', label: 'Family communication' },
            { id: 'schedules', label: 'Schedules and events' },
            { id: 'payments', label: 'Registrations or payments' },
            { id: 'coach-resources', label: 'Coach or player resources' },
          ],
        },
        {
          id: 'creator_path',
          type: 'multi',
          question: 'As a creator or expert, what would help most right now?',
          helper: 'These choices help us focus on audience growth, offers, courses, content, and client delivery.',
          displayRules: [{ questionId: 'organization_type', equals: 'creator' }],
          maxSelections: 4,
          choices: [
            { id: 'audience-growth', label: 'Grow the audience' },
            { id: 'offer-page', label: 'Sell or explain an offer' },
            { id: 'course', label: 'Build a course or learning path' },
            { id: 'community', label: 'Serve a community' },
            { id: 'content', label: 'Organize content' },
            { id: 'client-delivery', label: 'Improve client delivery' },
          ],
        },
        {
          id: 'public_sector_path',
          type: 'multi',
          question: 'For your public service team, what would help most right now?',
          helper: 'These choices help us focus on residents, staff, services, requests, updates, and access.',
          displayRules: [{ questionId: 'organization_type', equals: 'public-sector' }],
          maxSelections: 4,
          choices: [
            { id: 'resident-services', label: 'Help residents access services' },
            { id: 'forms', label: 'Make requests easier' },
            { id: 'updates', label: 'Share clear updates' },
            { id: 'staff-workflow', label: 'Support staff workflow' },
            { id: 'resources', label: 'Organize resources' },
            { id: 'reporting', label: 'Improve reporting' },
          ],
        },
      ],
    },
    {
      id: 'vision',
      title: 'Your Goals',
      intent: 'Tell us what you want help with first.',
      questions: [
        {
          id: 'desired_experiences',
          type: 'multi',
          question: 'How can we help you achieve your goals?',
          helper: 'Choose everything that feels useful. Your selections decide which questions come next.',
          required: true,
          maxSelections: 6,
          choices: [
            { id: 'landing-page', label: 'Create or improve a landing page', description: 'Help people understand the offer and take the next step', unlocks: ['landing-page'] },
            { id: 'connect', label: 'Create a Connect profile', description: 'Give people a polished place to learn, connect, and take action', unlocks: ['connect'] },
            { id: 'portal', label: 'Create a client, member, or team portal', description: 'Give people one private place for resources, updates, and next steps', unlocks: ['portal'] },
            { id: 'training', label: 'Build training or onboarding', description: 'Turn knowledge into guides, lessons, and repeatable paths', unlocks: ['training'] },
            { id: 'operations', label: 'Make daily work easier', description: 'Improve scheduling, follow-up, handoffs, documents, or reporting', unlocks: ['operations'] },
            { id: 'communication', label: 'Improve communication', description: 'Make updates, reminders, and messages clearer', unlocks: ['communication'] },
            { id: 'automation', label: 'Save time with automation', description: 'Reduce repeated manual work', unlocks: ['automation'] },
            { id: 'events', label: 'Support events or programs', description: 'Help with registration, schedules, reminders, and participation', unlocks: ['events'] },
          ],
          recommendationTags: ['scope'],
          outputMapping: 'scope.desiredExperiences',
        },
        {
          id: 'goal_notes',
          type: 'multi-text',
          question: 'Is there another goal you want us to understand?',
          helper: 'Optional. Use these prompts for ideas, then add anything the choices do not capture.',
          placeholder: 'Add another goal, idea, or priority.',
          choices: [
            { id: 'launch-something-new', label: 'Launch something new' },
            { id: 'look-more-professional', label: 'Look more professional' },
            { id: 'make-follow-up-easier', label: 'Make follow-up easier' },
            { id: 'serve-people-better', label: 'Serve people better' },
            { id: 'save-time', label: 'Save time' },
            { id: 'increase-revenue', label: 'Increase revenue or donations' },
            { id: 'organize-resources', label: 'Organize resources' },
            { id: 'reduce-confusion', label: 'Reduce confusion' },
          ],
          outputMapping: 'vision.goalNotes',
        },
        {
          id: 'training_needs',
          type: 'multi-text',
          question: 'Could training solutions help your team, clients, members, or audience?',
          helper: 'Optional. Efficiency Architects can help turn knowledge into training, onboarding, guides, and learning paths.',
          placeholder: 'Tell us what people need to learn, practice, understand, or repeat.',
          choices: [
            { id: 'team-training', label: 'Train our team' },
            { id: 'client-onboarding', label: 'Onboard clients or customers' },
            { id: 'member-education', label: 'Educate members or families' },
            { id: 'volunteer-training', label: 'Train volunteers' },
            { id: 'course-or-lessons', label: 'Create a course or lessons' },
            { id: 'sop-library', label: 'Build process guides' },
            { id: 'resource-library', label: 'Create a resource library' },
            { id: 'ai-guided-training', label: 'Add AI-guided support' },
          ],
          outputMapping: 'vision.trainingNeeds',
        },
        {
          id: 'top_priorities',
          type: 'multi',
          question: 'What would feel most valuable first?',
          helper: 'This helps us recommend a first version that feels useful quickly.',
          maxSelections: 3,
          choices: [
            { id: 'generate-leads', label: 'Generate better leads' },
            { id: 'serve-existing-people', label: 'Serve existing people better' },
            { id: 'reduce-admin', label: 'Reduce administrative work' },
            { id: 'improve-trust', label: 'Improve trust and professionalism' },
            { id: 'organize-content', label: 'Organize content and resources' },
            { id: 'increase-visibility', label: 'See what is happening faster' },
            { id: 'launch-offer', label: 'Launch a new offer or program' },
          ],
          recommendationTags: ['priorities'],
          outputMapping: 'vision.topPriorities',
        },
        {
          id: 'success_definition',
          type: 'single',
          question: 'What would make this feel like a win?',
          helper: 'Pick the result that would matter most to you.',
          choices: [
            { id: 'more-inquiries', label: 'More qualified inquiries' },
            { id: 'less-confusion', label: 'Less confusion for people we serve' },
            { id: 'less-manual-work', label: 'Less manual work for our team' },
            { id: 'faster-onboarding', label: 'Faster onboarding' },
            { id: 'better-experience', label: 'A more premium experience' },
            { id: 'more-revenue', label: 'More revenue or donations' },
          ],
          outputMapping: 'vision.successDefinition',
        },
        {
          id: 'revenue_range',
          type: 'single',
          question: 'What size is the organization right now?',
          helper: 'This helps us recommend a practical first step. It does not lock you into a package or price.',
          required: true,
          choices: [
            { id: 'Under $100k', label: 'Under $100k' },
            { id: '$100k to $500k', label: '$100k to $500k' },
            { id: '$500k to $1M', label: '$500k to $1M' },
            { id: '$1M to $5M', label: '$1M to $5M' },
            { id: 'More than $5M', label: 'More than $5M' },
          ],
          outputMapping: 'profile.revenueRange',
        },
      ],
    },
    {
      id: 'current',
      title: 'What You Use Today',
      intent: 'Tell us what you already have so we can recommend the simplest useful next step.',
      questions: [
        {
          id: 'current_systems',
          type: 'multi',
          question: 'What are you using today?',
          helper: 'Select anything you already use. This helps us avoid recommending something that ignores your real setup.',
          choices: [
            { id: 'Website builder or CMS', label: 'Website builder or CMS' },
            { id: 'CRM or contact database', label: 'CRM or contact database' },
            { id: 'Email marketing', label: 'Email marketing' },
            { id: 'Google Workspace or Microsoft 365', label: 'Google Workspace or Microsoft 365' },
            { id: 'Spreadsheets', label: 'Spreadsheets' },
            { id: 'Scheduling or calendar', label: 'Scheduling or calendar' },
            { id: 'Payment processor', label: 'Payment processor' },
            { id: 'Learning platform', label: 'Learning platform' },
            { id: 'Project management', label: 'Project management' },
            { id: 'Everything is mostly manual', label: 'Everything is mostly manual' },
          ],
          recommendationTags: ['technology'],
          outputMapping: 'current.systems',
        },
        {
          id: 'current_experience_state',
          type: 'multi',
          question: 'What would you like to make easier for people?',
          helper: 'Optional. This helps us understand the experience from the client, member, student, family, or visitor side.',
          maxSelections: 4,
          choices: [
            { id: 'find-next-step', label: 'Know what to do next' },
            { id: 'get-answers', label: 'Get answers faster' },
            { id: 'find-resources', label: 'Find resources in one place' },
            { id: 'receive-updates', label: 'Receive clear updates' },
            { id: 'understand-value', label: 'Understand the value quickly' },
            { id: 'submit-information', label: 'Submit information or documents' },
            { id: 'track-progress', label: 'Track progress or status' },
          ],
          recommendationTags: ['experience-friction'],
          outputMapping: 'current.friction',
        },
        {
          id: 'current_url',
          type: 'text',
          question: 'Is there a current website, social page, or portal we can learn from?',
          helper: 'A link gives us real context and helps us preserve what already works.',
          placeholder: 'Optional URL',
          outputMapping: 'current.url',
        },
      ],
    },
    {
      id: 'opportunities',
      title: 'Make It Easier',
      intent: 'Choose what would save time, improve service, or help people take the next step.',
      questions: [
        {
          id: 'operational_challenges',
          type: 'multi',
          question: 'What would help your organization grow?',
          helper: 'Choose the improvements that would help most right now.',
          maxSelections: 6,
          choices: [
            { id: 'manual_scheduling', label: 'Easier scheduling and booking' },
            { id: 'no_client_database', label: 'A clearer people or client hub' },
            { id: 'inconsistent_follow_up', label: 'More consistent follow-up' },
            { id: 'manual_invoicing', label: 'Smoother payments or billing' },
            { id: 'disconnected_systems', label: 'Better connection between tools' },
            { id: 'no_centralized_reporting', label: 'A clearer dashboard for decisions' },
            { id: 'manual_data_entry', label: 'Less repeated data entry' },
            { id: 'inconsistent_communication', label: 'Clearer communication rhythms' },
            { id: 'manual_onboarding', label: 'A smoother onboarding path' },
            { id: 'no_sops', label: 'Reusable process guidance' },
            { id: 'project_tracking_gaps', label: 'Cleaner request and project tracking' },
          ],
          recommendationTags: ['operations'],
          outputMapping: 'operations.challenges',
        },
        {
          id: 'repeated_work',
          type: 'multi',
          question: 'What would be valuable to make easier or more automatic?',
          helper: 'This helps us find practical ways to save time.',
          maxSelections: 4,
          choices: [
            { id: 'answering-common-questions', label: 'Answer common questions faster' },
            { id: 'sending-reminders', label: 'Send helpful reminders' },
            { id: 'collecting-documents', label: 'Collect documents more easily' },
            { id: 'explaining-next-steps', label: 'Explain next steps clearly' },
            { id: 'creating-reports', label: 'Create updates or reports faster' },
            { id: 'copying-data', label: 'Move information between tools' },
          ],
          recommendationTags: ['automation'],
        },
        {
          id: 'mistake_points',
          type: 'multi',
          question: 'Where do people need better support?',
          helper: 'Optional. Choose the places where reminders, status updates, or simple instructions would help.',
          maxSelections: 4,
          choices: [
            { id: 'handoffs', label: 'Passing work from one person to another' },
            { id: 'approvals', label: 'Approvals or decisions' },
            { id: 'payments', label: 'Payments' },
            { id: 'documents', label: 'Documents' },
            { id: 'scheduling', label: 'Scheduling' },
            { id: 'status-updates', label: 'Status updates' },
          ],
        },
      ],
    },
    {
      id: 'connect',
      title: 'Connect Discovery',
      intent: 'Shape the public profile around who should connect with you and what they should do next.',
      questions: [
        {
          id: 'connect_goal',
          type: 'single',
          question: 'What should your Connect profile help people do?',
          helper: 'Connect is best for a polished profile, quick trust, and simple next steps.',
          displayRules: [{ questionId: 'desired_experiences', includesAny: ['connect'] }],
          choices: [
            { id: 'contact-me', label: 'Contact me' },
            { id: 'book-time', label: 'Book time' },
            { id: 'view-offer', label: 'View an offer' },
            { id: 'see-proof', label: 'See proof or results' },
            { id: 'access-links', label: 'Find important links' },
            { id: 'join-list', label: 'Join a list or community' },
          ],
          recommendationTags: ['connect'],
        },
        {
          id: 'connect_audience',
          type: 'multi',
          question: 'Who is the profile mainly for?',
          helper: 'This changes the language, sections, proof, and calls to action.',
          displayRules: [{ questionId: 'desired_experiences', includesAny: ['connect'] }],
          maxSelections: 3,
          choices: [
            { id: 'clients', label: 'Clients or customers' },
            { id: 'partners', label: 'Partners' },
            { id: 'donors', label: 'Donors or sponsors' },
            { id: 'families', label: 'Families' },
            { id: 'athletes', label: 'Athletes or students' },
            { id: 'community', label: 'Community members' },
            { id: 'employers', label: 'Employers or recruiters' },
          ],
        },
        {
          id: 'connect_content',
          type: 'multi',
          question: 'What should the profile include?',
          helper: 'Choose the pieces that would make the profile useful and credible.',
          displayRules: [{ questionId: 'desired_experiences', includesAny: ['connect'] }],
          maxSelections: 6,
          choices: [
            { id: 'bio', label: 'Short bio' },
            { id: 'services', label: 'Services or offers' },
            { id: 'photos', label: 'Photos' },
            { id: 'video', label: 'Video' },
            { id: 'testimonials', label: 'Testimonials' },
            { id: 'links', label: 'Important links' },
            { id: 'calendar', label: 'Booking calendar' },
            { id: 'documents', label: 'Documents or downloads' },
          ],
        },
      ],
    },
    {
      id: 'landing',
      title: 'Landing Page Discovery',
      intent: 'Shape the page around the action, audience, and trust needed to move people forward.',
      questions: [
        {
          id: 'landing_goal',
          type: 'single',
          question: 'What should the landing page help people confidently do?',
          helper: 'The strongest landing pages guide one clear action before adding extra complexity.',
          displayRules: [{ questionId: 'desired_experiences', includesAny: ['landing-page'] }],
          choices: [
            { id: 'book-call', label: 'Book a call' },
            { id: 'capture-lead', label: 'Capture a lead' },
            { id: 'sell-offer', label: 'Sell an offer' },
            { id: 'explain-program', label: 'Explain a program' },
            { id: 'promote-event', label: 'Promote an event' },
            { id: 'build-trust', label: 'Build trust before a conversation' },
          ],
          recommendationTags: ['landing-page'],
        },
        {
          id: 'landing_audience',
          type: 'multi',
          question: 'Who should feel seen and ready to take action?',
          helper: 'Knowing the audience shapes the message, proof, visuals, and call to action.',
          displayRules: [{ questionId: 'desired_experiences', includesAny: ['landing-page'] }],
          maxSelections: 3,
          choices: [
            { id: 'customers', label: 'Customers or clients' },
            { id: 'members', label: 'Members' },
            { id: 'parents-families', label: 'Parents or families' },
            { id: 'students-athletes', label: 'Students or athletes' },
            { id: 'donors-sponsors', label: 'Donors or sponsors' },
            { id: 'staff-volunteers', label: 'Staff or volunteers' },
            { id: 'partners', label: 'Partners' },
          ],
        },
        {
          id: 'trust_builders',
          type: 'multi',
          question: 'What trust builders can help people feel confident?',
          helper: 'This is optional, but proof helps the page feel real, credible, and specific.',
          displayRules: [{ questionId: 'desired_experiences', includesAny: ['landing-page'] }],
          maxSelections: 5,
          choices: [
            { id: 'testimonials', label: 'Testimonials' },
            { id: 'case-studies', label: 'Case studies or results' },
            { id: 'photos', label: 'Real photos' },
            { id: 'videos', label: 'Videos' },
            { id: 'credentials', label: 'Credentials or awards' },
            { id: 'partners', label: 'Partners or sponsors' },
            { id: 'not-yet', label: 'Not yet' },
          ],
        },
      ],
    },
    {
      id: 'portal',
      title: 'Portal Discovery',
      intent: 'Shape the private experience around the people who need access, resources, and next steps.',
      questions: [
        {
          id: 'portal_users',
          type: 'multi',
          question: 'Who should the portal support?',
          helper: 'Portal users determine permissions, navigation, dashboards, and the kind of support people need.',
          displayRules: [{ questionId: 'desired_experiences', includesAny: ['portal'] }],
          maxSelections: 5,
          choices: [
            { id: 'clients', label: 'Clients' },
            { id: 'members', label: 'Members' },
            { id: 'families', label: 'Families' },
            { id: 'students-athletes', label: 'Students or athletes' },
            { id: 'staff', label: 'Staff' },
            { id: 'volunteers', label: 'Volunteers' },
            { id: 'sponsors-partners', label: 'Sponsors or partners' },
          ],
          recommendationTags: ['portal'],
        },
        {
          id: 'portal_modules',
          type: 'multi',
          question: 'What should the portal make possible for them?',
          helper: 'These selections help us recommend what belongs in the first version.',
          displayRules: [{ questionId: 'desired_experiences', includesAny: ['portal'] }],
          maxSelections: 7,
          choices: [
            { id: 'dashboard', label: 'See a dashboard' },
            { id: 'documents', label: 'Access documents' },
            { id: 'messaging', label: 'Send or receive messages' },
            { id: 'training', label: 'Complete training' },
            { id: 'payments', label: 'Make payments' },
            { id: 'calendar-events', label: 'Calendar or events' },
            { id: 'notifications', label: 'Notifications' },
            { id: 'ai-assistant', label: 'AI assistant' },
            { id: 'reporting', label: 'Reports' },
            { id: 'resources', label: 'Resource library' },
          ],
          recommendationTags: ['modules'],
        },
        {
          id: 'permission_complexity',
          type: 'single',
          question: 'How personalized should access feel?',
          helper: 'This helps us size permissions and private views without overbuilding.',
          displayRules: [{ questionId: 'desired_experiences', includesAny: ['portal'] }],
          choices: [
            { id: 'simple', label: 'Simple', description: 'Most people see the same things' },
            { id: 'moderate', label: 'Moderate', description: 'A few user groups need different views' },
            { id: 'advanced', label: 'Advanced', description: 'Many roles, private areas, or approvals' },
          ],
        },
      ],
    },
    {
      id: 'assets',
      title: 'Existing Assets',
      intent: 'Identify the assets that can make the first build feel specific, trusted, and alive.',
      questions: [
        {
          id: 'asset_types',
          type: 'asset-select',
          question: 'What assets can help us tell the story well?',
          helper: 'Select what exists. Uploads appear only for what you choose, so you never have to sort through irrelevant file fields.',
          maxSelections: 8,
          choices: [
            { id: 'logo', label: 'Logo' },
            { id: 'photos', label: 'Photos' },
            { id: 'videos', label: 'Videos' },
            { id: 'documents', label: 'Documents' },
            { id: 'policies', label: 'Policies or documents' },
            { id: 'presentations', label: 'PowerPoints or decks' },
            { id: 'brand-guidelines', label: 'Brand guidelines' },
            { id: 'social-media', label: 'Social media content' },
            { id: 'testimonials', label: 'Testimonials' },
          ],
          recommendationTags: ['assets'],
        },
        {
          id: 'brand_feel',
          type: 'multi',
          question: 'How should people feel as they move through the experience?',
          helper: 'This guides visual direction without requiring design jargon.',
          maxSelections: 3,
          choices: [
            { id: 'warm', label: 'Warm' },
            { id: 'premium', label: 'Premium' },
            { id: 'energetic', label: 'Energetic' },
            { id: 'calm', label: 'Calm' },
            { id: 'trustworthy', label: 'Trustworthy' },
            { id: 'bold', label: 'Bold' },
            { id: 'community-centered', label: 'Community-centered' },
          ],
        },
      ],
    },
    {
      id: 'future',
      title: 'Future Possibilities',
      intent: 'Leave room for what the organization could become after the first build.',
      questions: [
        {
          id: 'future_limitless',
          type: 'single',
          question: 'If technology removed the limitations, what would you most want the organization to become?',
          helper: 'This feeds long-term opportunities, not just the first build.',
          choices: [
            { id: 'self-running', label: 'More self-running' },
            { id: 'more-human', label: 'More human and personal' },
            { id: 'more-visible', label: 'More visible and trusted' },
            { id: 'more-scalable', label: 'More scalable' },
            { id: 'more-connected', label: 'More connected as a community' },
            { id: 'more-intelligent', label: 'More intelligent and data-driven' },
          ],
          recommendationTags: ['future'],
        },
        {
          id: 'ai_247',
          type: 'multi',
          question: 'If an AI assistant worked for you 24/7, what would you ask it to help with?',
          helper: 'This reveals future automation, service, training, and portal opportunities.',
          maxSelections: 4,
          choices: [
            { id: 'answer-questions', label: 'Answer common questions' },
            { id: 'summarize-activity', label: 'Summarize activity' },
            { id: 'draft-communications', label: 'Draft communications' },
            { id: 'coach-users', label: 'Guide people through steps' },
            { id: 'surface-risks', label: 'Surface risks or missing items' },
            { id: 'recommend-actions', label: 'Recommend next actions' },
            { id: 'create-content', label: 'Create content' },
          ],
          recommendationTags: ['ai'],
        },
        {
          id: 'anything_else',
          type: 'multi-text',
          question: 'What else should we understand before we build your blueprint?',
          helper: 'Optional. These prompts can help you think through timing, hopes, needs, or concerns.',
          placeholder: 'Add any extra context you want us to know.',
          choices: [
            { id: 'timing', label: 'Timing matters' },
            { id: 'budget', label: 'Budget matters' },
            { id: 'must-have', label: 'There is a must-have feature' },
            { id: 'not-sure', label: 'I am not sure what I need yet' },
            { id: 'existing-system', label: 'We have something existing' },
            { id: 'team-buy-in', label: 'We need team buy-in' },
            { id: 'launch-date', label: 'We have a launch date' },
            { id: 'special-audience', label: 'Our audience has special needs' },
          ],
        },
      ],
    },
  ],
};

export function shouldShowQuestion(question: DiscoveryQuestion, answers: DiscoveryAnswers) {
  if (!question.displayRules?.length) return true;
  return question.displayRules.every((rule) => {
    const value = answers[rule.questionId];
    if (rule.equals !== undefined) return value === rule.equals;
    if (rule.includesAny?.length) {
      return Array.isArray(value) && rule.includesAny.some((item) => value.includes(item));
    }
    return true;
  });
}

export function visibleSections(schema: DiscoverySchema, answers: DiscoveryAnswers) {
  return schema.sections
    .map((section) => ({
      ...section,
      questions: section.questions.filter((question) => shouldShowQuestion(question, answers)),
    }))
    .filter((section) => section.questions.length > 0);
}

export function chunkQuestions(questions: DiscoveryQuestion[], size = 3) {
  const chunks: DiscoveryQuestion[][] = [];
  for (let index = 0; index < questions.length; index += size) {
    chunks.push(questions.slice(index, index + size));
  }
  return chunks;
}

function isMultiTextValue(value: DiscoveryAnswerValue): value is DiscoveryMultiTextValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && ('selected' in value || 'note' in value);
}

function isAssetUploadValue(value: DiscoveryAnswerValue): value is DiscoveryAssetUploadValue {
  return typeof value === 'object' && value !== null && !Array.isArray(value) && !isMultiTextValue(value);
}

export function answerLabel(question: DiscoveryQuestion, value: DiscoveryAnswerValue) {
  if (value === undefined || value === '' || (Array.isArray(value) && value.length === 0)) return '';
  if (isMultiTextValue(value)) {
    const selected = value.selected ?? [];
    const labels = selected.map((item) => question.choices?.find((choice) => choice.id === item)?.label ?? item);
    const note = value.note?.trim();
    return [...labels, note].filter(Boolean).join(', ');
  }
  if (isAssetUploadValue(value)) {
    return Object.values(value)
      .map((item) => item.fileName)
      .filter(Boolean)
      .join(', ');
  }
  if (typeof value === 'number') return String(value);
  if (!Array.isArray(value) && typeof value === 'string') {
    return question.choices?.find((choice) => choice.id === value)?.label ?? value;
  }
  return value.map((item) => question.choices?.find((choice) => choice.id === item)?.label ?? item).join(', ');
}

export function validateQuestions(questions: DiscoveryQuestion[], answers: DiscoveryAnswers) {
  for (const question of questions) {
    if (!question.required) continue;
    const value = answers[question.id];
    if (
      value === undefined ||
      value === '' ||
      (Array.isArray(value) && value.length === 0) ||
      (isMultiTextValue(value) && !(value.selected?.length || value.note?.trim()))
    ) {
      return `${question.question}`;
    }
  }
  return '';
}

export function buildDiscoverySummary(section: DiscoverySection, answers: DiscoveryAnswers) {
  const details = section.questions
    .map((question) => {
      const value = answerLabel(question, answers[question.id]);
      return value ? { label: question.question, value } : null;
    })
    .filter(Boolean) as Array<{ label: string; value: string }>;

  if (!details.length) {
    return ['We have enough to keep moving, and this section can stay light for now.'];
  }

  return details.slice(0, 4).map((item) => `${item.label} ${item.value}`);
}

export function buildDiscoveryRecommendations(answers: DiscoveryAnswers) {
  const desired = arrayAnswer(answers.desired_experiences);
  const priorities = arrayAnswer(answers.top_priorities);
  const modules = arrayAnswer(answers.portal_modules);
  const trainingNeeds = multiTextSelected(answers.training_needs);
  const challenges = arrayAnswer(answers.operational_challenges);
  const repeated = arrayAnswer(answers.repeated_work);
  const assets = arrayAnswer(answers.asset_types);

  const recommendations: string[] = [];
  if (desired.includes('landing-page')) {
    recommendations.push('A landing page could help people understand the offer and take the next step with confidence.');
  }
  if (desired.includes('connect')) {
    recommendations.push('A Connect profile could give people one polished place to learn about you, trust you, and reach out.');
  }
  if (desired.includes('portal')) {
    recommendations.push(`A portal could start with ${modules.length ? modules.slice(0, 3).join(', ') : 'resources, updates, and a simple dashboard'} so people know where to go.`);
  }
  if (desired.includes('training') || modules.includes('training') || trainingNeeds.length || multiTextNote(answers.training_needs)) {
    recommendations.push('Training could turn repeat explanations into clear lessons, resources, and next steps.');
  }
  if (desired.includes('automation') || repeated.length || challenges.includes('manual_data_entry')) {
    recommendations.push('Automation could save time by handling reminders, document collection, updates, and repeated steps.');
  }
  if (desired.includes('communication') || challenges.includes('inconsistent_communication')) {
    recommendations.push('Better communication could help people know what is happening and what to do next.');
  }
  if (assets.length) {
    recommendations.push(`Your existing ${assets.slice(0, 4).join(', ')} can help the first version feel real and trustworthy.`);
  }
  if (priorities.includes('reduce-admin')) {
    recommendations.push('A strong first move would be making one repeated admin task easier for the team.');
  }
  if (!recommendations.length) {
    recommendations.push('You have enough to start with a focused blueprint and choose the first useful step.');
  }

  return recommendations;
}

export function buildSubmissionPayload(
  answers: DiscoveryAnswers,
  considerSlug?: string,
  partnerSlug?: string,
  factoryOpportunity?: string,
) {
  const discoveryAnswers = factoryOpportunity
    ? { ...answers, factory_opportunity: factoryOpportunity }
    : answers;

  return {
    businessName: stringAnswer(answers.organization_name),
    contactName: stringAnswer(answers.contact_name),
    email: stringAnswer(answers.contact_email),
    teamSizeLabel: stringAnswer(answers.team_size),
    revenueRange: stringAnswer(answers.revenue_range),
    currentSystems: arrayAnswer(answers.current_systems).join(', '),
    operationalChallenges: arrayAnswer(answers.operational_challenges),
    growthGoals: stringAnswer(answers.success_definition) || arrayAnswer(answers.top_priorities).join(', '),
    capacityConstraints: [
      ...arrayAnswer(answers.current_experience_state),
      ...arrayAnswer(answers.repeated_work),
      ...arrayAnswer(answers.mistake_points),
      multiTextAnswer(answers.goal_notes),
      multiTextAnswer(answers.training_needs),
      stringAnswer(answers.anything_else),
      multiTextAnswer(answers.anything_else),
    ]
      .filter(Boolean)
      .join('; '),
    considerSlug,
    partnerSlug,
    discoveryVersion: DISCOVERY_SCHEMA.version,
    factoryOpportunity,
    discoveryAnswers,
    desiredExperiences: arrayAnswer(answers.desired_experiences),
    assetUploads: assetUploadAnswer(answers.asset_uploads),
  };
}

function assetUploadAnswer(value: DiscoveryAnswerValue) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return undefined;
  if ('selected' in value || 'note' in value) return undefined;
  return value as DiscoveryAssetUploadValue;
}

function stringAnswer(value: DiscoveryAnswerValue) {
  return typeof value === 'string' ? value.trim() : '';
}

function arrayAnswer(value: DiscoveryAnswerValue) {
  return Array.isArray(value) ? value : [];
}

function multiTextAnswer(value: DiscoveryAnswerValue) {
  if (!isMultiTextValue(value)) return '';
  return [...(value.selected ?? []), value.note?.trim()].filter(Boolean).join('; ');
}

function multiTextSelected(value: DiscoveryAnswerValue) {
  return isMultiTextValue(value) ? value.selected ?? [] : [];
}

function multiTextNote(value: DiscoveryAnswerValue) {
  return isMultiTextValue(value) ? value.note?.trim() ?? '' : '';
}
