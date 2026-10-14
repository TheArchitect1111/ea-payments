'use client';

export type ConfirmationLetterData = {
  type: 'live' | 'waitlist';
  subject: string;
  body_html: string;
  first_name: string;
};

function safeHtml(template: string, values: Record<string, string>) {
  let escaped = template
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
  for (const [key, value] of Object.entries(values)) {
    escaped = escaped.replaceAll(`{{${key}}}`, value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'));
  }
  return escaped.replace(/&lt;(\/?(?:p|br|strong|em|ul|ol|li))&gt;/gi, '<$1>');
}

export default function ConfirmationLetter({
  letter,
  firstName,
  className,
  includeWelcome = false,
}: {
  letter: ConfirmationLetterData;
  firstName: string;
  className: string;
  includeWelcome?: boolean;
}) {
  const html = safeHtml(letter.body_html, { first_name: firstName, class_name: className });
  return (
    <section role="status" aria-live="polite" className="my-8 rounded-lg border border-[#ddd7cb] bg-[#fffdf8] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#596b5b]">
        {letter.type === 'live' ? 'Registration received' : 'Waitlist confirmed'}
      </p>
      <h2 className="mt-2 font-serif text-2xl">{letter.subject.replace('{{class_name}}', className)}</h2>
      {includeWelcome ? <>
        <p className="mt-4 leading-7">Welcome. Whether you are here to restore your well-being, grow your clinical skills, or build something meaningful, I want you to feel supported in taking your next step. My work brings health, education and purpose together, with practical guidance and care for the person behind every goal.</p>
        <p className="mt-3 leading-7">Explore the path that fits where you are today. I look forward to connecting with you.</p>
      </> : null}
      <div className="mt-4 leading-7" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
