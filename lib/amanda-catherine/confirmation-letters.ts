import { airtableUpdate } from '@/lib/data/airtable-client';
import { create, rows, type Row } from '@/lib/amanda-catherine/registry';

export type AmandaConfirmationType = 'live' | 'waitlist';
export type AmandaConfirmationLetter = {
  type: AmandaConfirmationType;
  subject: string;
  body_html: string;
  editable: boolean;
  updated_at?: string;
};

function toLetter(row: Row): AmandaConfirmationLetter {
  return {
    type: String(row.fields.type || 'waitlist') as AmandaConfirmationType,
    subject: String(row.fields.subject || ''),
    body_html: String(row.fields.body_html || ''),
    editable: row.fields.editable !== false,
    updated_at: String(row.fields.updated_at || ''),
  };
}

const PREVIEW_WARM_LETTERS: Record<AmandaConfirmationType, AmandaConfirmationLetter> = {
  live: {
    type: 'live',
    subject: "You're in! Welcome to {{class_name}} + Your First Micro-Win",
    body_html: '<p>Hi {{first_name}},</p><p>You are registered for <strong>{{class_name}}</strong> at AesthetiKine Studio.</p><p><strong>Your first micro-win (watch now - 2 mins):</strong><br><a href="{{welcome_video_url}}">Welcome Video - Start Here</a></p><p><strong>What to bring / Where to park / What to wear:</strong><br><a href="{{what_to_bring_url}}">Download PDF + Parking Map</a></p><p><strong>Calendar Invite:</strong><br><a href="{{calendar_ics_url}}">Add to Calendar (.ics)</a></p><p><strong>Your Learning Portal:</strong><br><a href="https://aesthetikine.com/portal/amanda-catherine/learning">Portal - Learning</a></p><p>In 60 mins you will leave able to safely assess & map face & body contouring clients.</p><p>See you at AesthetiKine!<br>Warmly,<br>Amanda Catherine<br>226-581-2003</p><p><em>P.S. This training is NOT for non-licensed practitioners - safety filter applies.’s community.</p><p>Hi {{first_name}},</p><p>Hi {{first_name}},</p><p>You are registered for <strong>{{class_name}}</strong> at AesthetiKine Studio.</p><p><strong>Your first micro-win (watch now - 2 mins):</strong><br><a href="{{welcome_video_url}}">Welcome Video - Start Here</a></p><p><strong>What to bring / Where to park / What to wear:</strong><br><a href="{{what_to_bring_url}}">Download PDF + Parking Map</a></p><p><strong>Calendar Invite:</strong><br><a href="{{calendar_ics_url}}">Add to Calendar (.ics)</a></p><p><strong>Your Learning Portal:</strong><br><a href="https://aesthetikine.com/portal/amanda-catherine/learning">Portal - Learning</a></p><p>In 60 mins you will leave able to safely assess & map face & body contouring clients.</p><p>See you at AesthetiKine!<br>Warmly,<br>Amanda Catherine<br>226-581-2003</p><p><em>P.S. This training is NOT for non-licensed practitioners - safety filter applies.<p>Warmly,<br>Amanda Catherine</p>',
    editable: false,
  },
  waitlist: {
    type: 'waitlist',
    subject: "You're on the waitlist for {{class_name}}",
    body_html: '<p>Hi {{first_name}},</p><p>You are registered for <strong>{{class_name}}</strong> at AesthetiKine Studio.</p><p><strong>Your first micro-win (watch now - 2 mins):</strong><br><a href="{{welcome_video_url}}">Welcome Video - Start Here</a></p><p><strong>What to bring / Where to park / What to wear:</strong><br><a href="{{what_to_bring_url}}">Download PDF + Parking Map</a></p><p><strong>Calendar Invite:</strong><br><a href="{{calendar_ics_url}}">Add to Calendar (.ics)</a></p><p><strong>Your Learning Portal:</strong><br><a href="https://aesthetikine.com/portal/amanda-catherine/learning">Portal - Learning</a></p><p>In 60 mins you will leave able to safely assess & map face & body contouring clients.</p><p>See you at AesthetiKine!<br>Warmly,<br>Amanda Catherine<br>226-581-2003</p><p><em>P.S. This training is NOT for non-licensed practitioners - safety filter applies.’s community.</p><p>Hi {{first_name}},</p><p>Thank you for joining the waitlist for <strong>{{class_name}}</strong>. Amanda’s team will contact you when enrollment information is available. We look forward to sharing the next steps with you.</p><p>Warmly,<br>Amanda Catherine</p>',
    editable: false,
  },
};

export async function listAmandaConfirmationLetters() {
  if (process.env.VERCEL_ENV === 'preview') return [PREVIEW_WARM_LETTERS.live, PREVIEW_WARM_LETTERS.waitlist];
  const records = await rows('confirmation_letters', "OR({type}='live',{type}='waitlist')");
  return records.map(toLetter);
}

export async function getAmandaConfirmationLetter(type: AmandaConfirmationType) {
  if (process.env.VERCEL_ENV === 'preview') return PREVIEW_WARM_LETTERS[type];
  const records = await rows('confirmation_letters', `{type}='${type}'`);
  if (records[0]) return toLetter(records[0]);
  return type === 'live'
    ? { type, subject: "You're in! Welcome to {{class_name}} + Your First Micro-Win", body_html: '<p>Hi {{first_name}},</p><p>Your registration for <strong>{{class_name}}</strong> has been received. Amanda’s team will send next steps to this email address.</p><p>Warmly,<br>Amanda Catherine</p>', editable: true }
    : { type, subject: "You're on the waitlist for {{class_name}}", body_html: '<p>Hi {{first_name}},</p><p>Thank you for joining the waitlist for <strong>{{class_name}}</strong>. Amanda’s team will contact you when enrollment information is available.</p><p>Warmly,<br>Amanda Catherine</p>', editable: true };
}

export async function saveAmandaConfirmationLetter(letter: AmandaConfirmationLetter) {
  const existing = await rows('confirmation_letters', `{type}='${letter.type}'`);
  const fields = {
    type: letter.type,
    subject: letter.subject.slice(0, 200),
    body_html: letter.body_html.slice(0, 10000),
    editable: true,
    updated_at: new Date().toISOString(),
  };
  if (existing[0]) {
    const saved = await airtableUpdate('confirmation_letters', existing[0].id, fields);
    if (!saved) throw new Error('Confirmation letter could not be saved.');
    return toLetter({ ...existing[0], fields: { ...existing[0].fields, ...fields } });
  }
  const created = await create('confirmation_letters', fields);
  return toLetter({ id: created.id, fields });
}
