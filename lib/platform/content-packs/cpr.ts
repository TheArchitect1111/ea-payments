import type { LandingPageConfig } from '@/lib/landing-chassis/types';
import type { ContentPackContext, VerticalContentPack } from './types';
import { CPR_ASSETS } from './cpr-assets';

/**
 * CPR athletics vertical — deepened pack.
 * Copy aligned with Connect CPR journey + Parent Recruiting Guide.
 * Imagery from local recruiting/camp proofs + athletics atmosphere stills.
 */
export const cprAthleticsContentPack: VerticalContentPack = {
  id: 'cpr-athletics',
  platformClientId: 'cpr',
  vertical: 'athletics-recruiting',
  label: 'CPR Athletics Pack',
  summary:
    'Faith · Family · Basketball · Future — player pathways, parent guide, Connect nurture, and Team Portal chrome for Canadian Prospects Recruitment.',
  apply(base, ctx) {
    const portal = `/portal/${ctx.portalSlug}`;
    const connect = '/connect/cpr';
    const guide = '/connect/cpr/go/parent-recruiting-guide?campaign=site';
    const journey = '/connect/cpr/journey';
    const logo = ctx.logo && ctx.logo !== '/ea-logo.png' ? ctx.logo : CPR_ASSETS.logo;

    return {
      ...base,
      brand: {
        nameLine1: 'Canadian',
        nameLine2: 'Prospects',
        tagline: 'Faith. Family. Basketball. Future.',
        logo,
      },
      colors: {
        ...base.colors,
        primary: '#050505',
        primaryBright: '#CC0000',
        black: '#0C0C0A',
        dark: '#08090B',
        offWhite: '#F7F7F5',
        white: '#FFFFFF',
      },
      links: {
        apply: connect,
        video: '/athletics-experience',
        agreement: guide,
        schedule: journey,
        instagram: undefined,
      },
      nav: [
        { label: 'Home', href: '#top' },
        { label: 'Pathway', href: '#how-it-works' },
        { label: 'Families', href: '#portal' },
        { label: 'Programs', href: journey },
        { label: 'Team Portal', href: portal },
        { label: 'Get the guide', href: connect },
      ],
      possibility: {
        headline: 'Every prospect. Every family. One recruiting home.',
        subheadline:
          'Canadian Prospects helps athletes get seen — and helps parents understand the next right step after camp, showcase, or tryout.',
        supporting:
          'Train. Compete. Grow. Succeed. Visibility, development, exposure, academics, and the conversation that comes next.',
        image: CPR_ASSETS.hero,
        applyLabel: 'Get the Parent Recruiting Guide',
        videoLabel: 'Watch the athletics story',
      },
      socialProof: {
        heading: 'Trusted after the tournament handshake',
        items: [
          {
            quote:
              'We finally understood what comes after camp — visibility, academics, and the next conversation.',
            name: 'Parent · U16',
            role: 'Toronto Showcase',
            photo: CPR_ASSETS.family,
          },
          {
            quote:
              'Profiles, film, and family updates live in one place. Recruiting stopped feeling like guesswork.',
            name: 'Program director',
            role: 'Partner academy',
            photo: CPR_ASSETS.camp,
          },
          {
            quote:
              'Charlotte Tournament: 42 connections. The parent guide is still our highest-opening CPR resource.',
            name: 'CPR field team',
            role: 'Event capture',
            photo: CPR_ASSETS.tournament,
          },
        ],
      },
      philosophy: {
        label: 'The CPR way',
        quote:
          'Recruiting is a process, not a single event. Families need a plan for development, exposure, communication, and decisions.',
        attribution: 'Parent Recruiting Guide · Canadian Prospects',
        points: [
          'Know the path — process over one-off showcases',
          'Build the profile — academics, film, growth, coachability',
          'Choose the next step — evaluation, guidance, realistic plan',
        ],
      },
      challenge: {
        heading: 'The recruiting maze',
        intro:
          'Families leave events with hope — and a dozen unanswered questions about exposure, eligibility, and who to trust next.',
        painPoints: [
          'Film, waivers, schedules, and coach notes scattered across texts and drives',
          'Parents unsure what “next step” actually means after a showcase',
          'Athletes lose momentum between camp, evaluation, and college conversations',
          'No shared home for players, families, and the CPR recruiting team',
        ],
      },
      difference: {
        heading: 'Built for the prospect pathway',
        subheading:
          'Same ClientConfig drives the CPR landing, Connect nurture, and Team Portal — so families and coaches hear one story.',
        cards: [
          {
            title: 'Player profiles',
            description: 'Development notes, film cues, and recruiting timeline in one athlete record.',
          },
          {
            title: 'Family clarity',
            description: 'Parent Recruiting Guide, FAQ, and portal updates — without chasing threads.',
          },
          {
            title: 'Event → nurture',
            description: 'Connect capture after camps and showcases routes into CPR follow-up sequences.',
          },
          {
            title: 'Eligibility + academics',
            description: 'Alerts stay visible beside recruiting activity — not in a side spreadsheet.',
          },
        ],
      },
      process: {
        heading: 'How CPR moves a prospect forward',
        subheading: 'From first conversation to committed pathway.',
        steps: [
          {
            label: 'Discover',
            description: 'Meet CPR at a camp, showcase, or family conversation — capture the relationship immediately.',
            icon: 'opportunities',
          },
          {
            label: 'Guide',
            description: 'Send the Parent Recruiting Guide and FAQ so families know the next right move.',
            icon: 'school',
          },
          {
            label: 'Evaluate',
            description: 'Athlete evaluation, film, and profile updates land in the Team Portal.',
            icon: 'trackicon',
          },
          {
            label: 'Advance',
            description: 'Consultation, recruiting milestones, and college conversations with the right CPR team.',
            icon: 'recruiting',
          },
        ],
      },
      portal: {
        heading: ctx.workspaceName || 'CPR Team Portal',
        subheading: 'Players, families, and coaches — one athletics operating surface.',
        features: [
          {
            title: 'Player Focus',
            description: 'Open profiles, update recruiting timelines, and send family updates from one dock.',
            icon: 'manage',
          },
          {
            title: 'Eligibility alerts',
            description: 'Surface eligibility and academic readiness before they become blockers.',
            icon: 'lock',
          },
          {
            title: 'Film & resources',
            description: 'Library language families understand — not just internal coach folders.',
            icon: 'upload',
          },
          {
            title: 'Ask CPR',
            description: 'Recruiting Advisor for questions routed to the right team.',
            icon: 'updates',
          },
        ],
        dashboardImage: CPR_ASSETS.court,
      },
      results: {
        heading: 'Momentum you can measure',
        subheading: 'Event connections become guided sequences — not lost leads.',
        stats: [
          { value: '42', label: 'Charlotte connections' },
          { value: '31', label: 'Toronto showcase' },
          { value: '4', label: 'Nurture steps' },
        ],
        proofs: [
          { image: CPR_ASSETS.tournament, caption: 'Tournament follow-up' },
          { image: CPR_ASSETS.camp, caption: 'Camp & evaluation' },
          { image: CPR_ASSETS.event, caption: 'Family connection' },
        ],
        profileCta: 'Enter the Team Portal',
        profileHref: portal,
      },
      founder: {
        heading: 'Canadian Prospects Recruitment',
        role: 'Athletics · Recruiting · Family clarity',
        story:
          'CPR exists so every prospect gets seen — and every family understands the pathway. Faith. Family. Basketball. Future. The EA chassis reproduces that promise as a portal and landing from one ClientConfig.',
        image: CPR_ASSETS.hustle,
      },
      finalCta: {
        heading: 'Ready for the next recruiting conversation?',
        subheading:
          'Get the Parent Recruiting Guide now — explore programs — or enter the Team Portal if you already train with CPR.',
        applyLabel: 'Get the Parent Recruiting Guide',
        agreementLabel: 'Open the guide',
        scheduleLabel: 'View programs & camps',
      },
      footer: {
        about:
          'Canadian Prospects Recruitment — athlete development, camps, showcases, and recruiting exposure with family-friendly clarity. Faith. Family. Basketball. Future.',
        quickLinks: [
          { label: 'Team Portal', href: portal },
          { label: 'Connect', href: connect },
          { label: 'Programs', href: journey },
          { label: 'Athletics story', href: '/athletics-experience' },
          { label: 'Contact', href: '/contact' },
        ],
        resources: [
          { label: 'Parent Recruiting Guide', href: guide },
          { label: 'CPR Connect', href: connect },
          { label: 'Journey', href: journey },
        ],
        email: 'hello@prospects.ca',
        instagramLabel: 'Canadian Prospects',
        prospectsInstagramLabel: 'Prospects athletes',
        location: 'Canada · Partner events nationwide',
        copyright: `© ${new Date().getFullYear()} Canadian Prospects Recruitment. Athletics pack on the EA chassis.`,
      },
    };
  },
};
