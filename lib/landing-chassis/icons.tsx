export const landingIcons: Record<string, string> = {
  apply: 'M9 2h8a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V6zm0 0v4H5m6 4h6m-6 4h6m-9-7l1.5 1.5L12 9',
  upload: 'M20 16.6A4.5 4.5 0 0017.5 8.5a6 6 0 00-11.4 1.9A4 4 0 006 18h12.6zM12 12v6m0-6l-2.5 2.5M12 12l2.5 2.5',
  agreement: 'M9 2h8a2 2 0 012 2v16a2 2 0 01-2 2H7a2 2 0 01-2-2V6zm4 9l5-5m0 0h-3.5M18 6v3.5M9 14h3m-3 4h6',
  recruiting: 'M3 11l13-5v12L3 13v-2zm13-5a4 4 0 010 12M7 13v5a2 2 0 002 2h1',
  opportunities: 'M4 21V10l8-6 8 6v11M9 21v-6h6v6M2 21h20M12 7v.01',
  send: 'M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z',
  manage: 'M16 4h4v4m0-4l-6 6M8 20H4v-4m0 4l6-6m6 6h4v-4m-4 4l-6-6M8 4H4v4m4-4l6 6',
  trackicon: 'M3 12h4l3-8 4 16 3-8h4',
  updates: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
  school: 'M22 9L12 4 2 9l10 5 10-5zm-16 4v4c0 1.7 2.7 3 6 3s6-1.3 6-3v-4',
  lock: 'M6 11h12a1 1 0 011 1v8a1 1 0 01-1 1H6a1 1 0 01-1-1v-8a1 1 0 011-1zm2 0V7a4 4 0 118 0v4m-4 5v2',
  mail: 'M4 5h16a1 1 0 011 1v12a1 1 0 01-1 1H4a1 1 0 01-1-1V6a1 1 0 011-1zm0 2l8 6 8-6',
  insta: 'M7 3h10a4 4 0 014 4v10a4 4 0 01-4 4H7a4 4 0 01-4-4V7a4 4 0 014-4zm5 12a3.5 3.5 0 100-7 3.5 3.5 0 000 7zm5.2-8.7v.01',
  pin: 'M12 21s7-5.5 7-11a7 7 0 10-14 0c0 5.5 7 11 7 11zm0-8.5a2.5 2.5 0 100-5 2.5 2.5 0 000 5z',
};

export function LandingIcon({ d, className = 'icon' }: { d: string; className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      <path d={d} />
    </svg>
  );
}
