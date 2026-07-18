/**
 * Sit-down visual product mockups for Concept Pack email.
 * Structure mirrors premium dark/gold demos: landing · ops portal · member home.
 * Email-safe nested tables — branded to the client (not bullet lists).
 */

const BLACK = '#0A0A0A';
const PANEL = '#141414';
const BORDER = '#2A2A2A';
const GOLD = '#C9A844';
const CREAM = '#F4EFE3';
const MUTED = '#9A9A9A';
const WHITE = '#FFFFFF';

export type ConceptMockupInput = {
  clientName: string;
  tagline: string;
  cta: string;
  heroImageUrl?: string;
  score: number;
  capacityLostLabel: string;
  opportunityLabel: string;
  landingSections: string[];
  portalNav: string[];
  memberNav: string[];
  escHtml: (s: string) => string;
};

function mockFrame(opts: {
  eyebrow: string;
  label: string;
  innerHtml: string;
  escHtml: (s: string) => string;
}): string {
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:0 0 28px;border:1px solid ${BORDER};background:${BLACK};">
    <tr>
      <td style="padding:12px 14px;border-bottom:1px solid ${BORDER};">
        <p style="margin:0;font-size:10px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">${opts.escHtml(opts.eyebrow)}</p>
        <p style="margin:4px 0 0;font-size:13px;font-weight:700;color:${WHITE};">${opts.escHtml(opts.label)}</p>
      </td>
    </tr>
    <tr>
      <td style="padding:0;">${opts.innerHtml}</td>
    </tr>
    <tr>
      <td style="padding:10px 14px;border-top:1px solid ${BORDER};">
        <p style="margin:0;font-size:11px;color:${MUTED};">Concept mockup for discussion — branded preview, not a finished build.</p>
      </td>
    </tr>
  </table>`;
}

function tile(label: string, escHtml: (s: string) => string): string {
  return `
    <td width="50%" style="padding:5px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PANEL};border:1px solid ${BORDER};">
        <tr><td style="padding:12px;">
          <p style="margin:0;font-size:11px;font-weight:700;color:${WHITE};">${escHtml(label)}</p>
          <p style="margin:6px 0 0;font-size:10px;color:${MUTED};">Live in their member home</p>
        </td></tr>
      </table>
    </td>`;
}

/** 1 · Public website / landing */
export function renderLandingMockup(input: ConceptMockupInput): string {
  const { escHtml } = input;
  const hero = input.heroImageUrl
    ? `<img src="${escHtml(input.heroImageUrl)}" alt="" width="560" style="width:100%;max-width:560px;height:220px;object-fit:cover;display:block;border:0;" />`
    : `<div style="height:220px;background:linear-gradient(135deg,#1a1a1a,${GOLD});"></div>`;

  const sections = input.landingSections
    .slice(0, 4)
    .map(
      (s, i) => `
      <td width="25%" style="padding:8px 6px;vertical-align:top;">
        <p style="margin:0 0 4px;font-size:10px;color:${GOLD};font-weight:700;">0${i + 1}</p>
        <p style="margin:0;font-size:11px;color:${CREAM};line-height:1.35;font-weight:600;">${escHtml(s)}</p>
      </td>`,
    )
    .join('');

  const inner = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BLACK};">
      <tr>
        <td style="padding:14px 16px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td style="font-size:12px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${GOLD};">${escHtml(input.clientName)}</td>
              <td align="right" style="font-size:10px;color:${MUTED};">Programs · Events · About · App</td>
            </tr>
          </table>
        </td>
      </tr>
      <tr><td>${hero}</td></tr>
      <tr>
        <td style="padding:18px 16px;">
          <p style="margin:0 0 8px;font-size:22px;line-height:1.2;font-weight:800;color:${WHITE};">More than a site.<br/><span style="color:${GOLD};">It's their journey.</span></p>
          <p style="margin:0 0 14px;font-size:13px;line-height:1.5;color:${CREAM};">${escHtml(input.tagline)}</p>
          <p style="margin:0 0 16px;">
            <span style="display:inline-block;background:${GOLD};color:${BLACK};padding:10px 16px;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:1px;">${escHtml(input.cta)}</span>
            <span style="display:inline-block;margin-left:10px;font-size:11px;color:${MUTED};">Watch the film →</span>
          </p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PANEL};border:1px solid ${BORDER};">
            <tr>
              <td style="padding:10px;text-align:center;border-right:1px solid ${BORDER};">
                <p style="margin:0;font-size:16px;font-weight:800;color:${GOLD};">${input.score}</p>
                <p style="margin:2px 0 0;font-size:9px;color:${MUTED};text-transform:uppercase;">Score</p>
              </td>
              <td style="padding:10px;text-align:center;border-right:1px solid ${BORDER};">
                <p style="margin:0;font-size:11px;font-weight:800;color:${WHITE};">${escHtml(input.capacityLostLabel)}</p>
                <p style="margin:2px 0 0;font-size:9px;color:${MUTED};text-transform:uppercase;">Capacity left</p>
              </td>
              <td style="padding:10px;text-align:center;">
                <p style="margin:0;font-size:11px;font-weight:800;color:${WHITE};">${escHtml(input.opportunityLabel)}</p>
                <p style="margin:2px 0 0;font-size:9px;color:${MUTED};text-transform:uppercase;">Opportunity</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
      <tr>
        <td style="padding:12px 10px 16px;">
          <p style="margin:0 0 8px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:${GOLD};">The journey</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${sections}</tr></table>
        </td>
      </tr>
    </table>`;

  return mockFrame({
    eyebrow: '1 · Website / landing',
    label: `${input.clientName} — public face`,
    innerHtml: inner,
    escHtml,
  });
}

/** 2 · Ops / client portal */
export function renderPortalMockup(input: ConceptMockupInput): string {
  const { escHtml } = input;
  const nav = input.portalNav
    .slice(0, 6)
    .map(
      (item, i) =>
        `<p style="margin:0 0 8px;font-size:11px;color:${i === 0 ? BLACK : CREAM};background:${i === 0 ? GOLD : 'transparent'};padding:6px 8px;font-weight:${i === 0 ? 800 : 500};">${escHtml(item)}</p>`,
    )
    .join('');

  const kpis = [
    { label: 'Capacity score', value: `${input.score}` },
    { label: 'Left on table', value: input.capacityLostLabel },
    { label: 'Upside', value: input.opportunityLabel },
  ]
    .map(
      (k) => `
      <td width="33%" style="padding:8px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${PANEL};border:1px solid ${BORDER};">
          <tr><td style="padding:12px;">
            <p style="margin:0;font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:1px;">${escHtml(k.label)}</p>
            <p style="margin:6px 0 0;font-size:15px;font-weight:800;color:${GOLD};">${escHtml(k.value)}</p>
          </td></tr>
        </table>
      </td>`,
    )
    .join('');

  const inner = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BLACK};">
      <tr>
        <td width="28%" style="vertical-align:top;background:#0F0F0F;border-right:1px solid ${BORDER};padding:14px 10px;">
          <p style="margin:0 0 14px;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${GOLD};">${escHtml(input.clientName)}</p>
          <p style="margin:0 0 10px;font-size:9px;color:${MUTED};text-transform:uppercase;">Operations</p>
          ${nav}
        </td>
        <td width="72%" style="vertical-align:top;padding:14px 12px;">
          <p style="margin:0 0 4px;font-size:16px;font-weight:800;color:${WHITE};">Welcome back</p>
          <p style="margin:0 0 14px;font-size:12px;color:${MUTED};">Here's what needs attention across ${escHtml(input.clientName)}.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${kpis}</tr></table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;background:${PANEL};border:1px solid ${BORDER};">
            <tr>
              <td style="padding:14px;">
                <p style="margin:0 0 8px;font-size:10px;letter-spacing:1px;text-transform:uppercase;color:${GOLD};">Command center</p>
                <p style="margin:0;font-size:12px;color:${CREAM};line-height:1.5;">Registrations · payments · events · communications — one ops home instead of scattered tools.</p>
                <div style="margin-top:12px;height:48px;background:linear-gradient(90deg,${GOLD}33,transparent);border-left:3px solid ${GOLD};"></div>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>`;

  return mockFrame({
    eyebrow: '2 · Client / ops portal',
    label: `${input.clientName} — where you run the system`,
    innerHtml: inner,
    escHtml,
  });
}

/** 3 · Member home */
export function renderMemberMockup(input: ConceptMockupInput): string {
  const { escHtml } = input;
  const hero = input.heroImageUrl
    ? `<img src="${escHtml(input.heroImageUrl)}" alt="" width="360" style="width:100%;max-width:360px;height:120px;object-fit:cover;display:block;border:0;" />`
    : `<div style="height:120px;background:linear-gradient(135deg,#222,${GOLD});"></div>`;

  const nav = input.memberNav
    .slice(0, 5)
    .map(
      (item, i) =>
        `<p style="margin:0 0 7px;font-size:11px;color:${i === 0 ? BLACK : CREAM};background:${i === 0 ? GOLD : 'transparent'};padding:5px 8px;font-weight:${i === 0 ? 800 : 500};">${escHtml(item)}</p>`,
    )
    .join('');

  const inner = `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BLACK};">
      <tr>
        <td width="26%" style="vertical-align:top;background:#0F0F0F;border-right:1px solid ${BORDER};padding:14px 10px;">
          <p style="margin:0 0 12px;font-size:10px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:${GOLD};">${escHtml(input.clientName)}</p>
          ${nav}
        </td>
        <td width="74%" style="vertical-align:top;padding:12px;">
          <p style="margin:0 0 4px;font-size:15px;font-weight:800;color:${WHITE};">Welcome back</p>
          <p style="margin:0 0 10px;font-size:12px;color:${MUTED};">Your journey with ${escHtml(input.clientName)}.</p>
          ${hero}
          <p style="margin:12px 0 8px;font-size:13px;font-weight:700;color:${CREAM};">More than a login. It's belonging.</p>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${tile("Today's focus", escHtml)}${tile('Next milestone', escHtml)}</tr></table>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"><tr>${tile('Highlights', escHtml)}${tile('Messages', escHtml)}</tr></table>
        </td>
      </tr>
    </table>`;

  return mockFrame({
    eyebrow: '3 · Member home',
    label: `${input.clientName} — where their people live`,
    innerHtml: inner,
    escHtml,
  });
}
