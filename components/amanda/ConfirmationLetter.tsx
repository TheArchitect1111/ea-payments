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
}: {
  letter: ConfirmationLetterData;
  firstName: string;
  className: string;
}) {
  const html = safeHtml(letter.body_html, { first_name: firstName, class_name: className });
  return (
    <section role="status" aria-live="polite" className="my-8 rounded-lg border border-[#ddd7cb] bg-[#fffdf8] p-6">
      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#596b5b]">
        {letter.type === 'live' ? 'Registration received' : 'Waitlist confirmed'}
      </p>
      <h2 className="mt-2 font-serif text-2xl">{letter.subject.replace('{{class_name}}', className)}</h2>
      <div className="mt-4" dangerouslySetInnerHTML={{ __html: html }} />
    </section>
  );
}
