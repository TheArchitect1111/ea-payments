const AVAILABLE = new Set(['wood-therapy','non-surgical-bbl','body-sculpt-certification','nervous-system-reset','clinical-fat-loss','clinical-fat-loss-injectables','strategy-call']);
export function amandaSingleCtaPolicy(key: string, title: string) {
 const normalized = key.trim().toLowerCase();
 const isAvailable = AVAILABLE.has(normalized) || title.trim().toLowerCase().startsWith('clinical fat loss');
 const isStarterKit = normalized === 'starter-kit' || title.trim().toLowerCase().startsWith('starter kit');
 return {isAvailable, isStarterKit, label: isAvailable ? 'Buy Now' : isStarterKit ? 'Request Info' : 'Join Waitlist',
   description: isAvailable ? 'Explore this program with Amanda.' : 'Join the waitlist for availability updates.'};
}
