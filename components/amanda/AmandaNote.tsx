type AmandaNoteProps = {
  courseName?: string;
  variant: 'waitlist' | 'registration';
};

export default function AmandaNote({ courseName, variant }: AmandaNoteProps) {
  return (
    <section className="amanda-card amanda-note" aria-labelledby="amanda-note-title">
      <h2 id="amanda-note-title">A note from Amanda</h2>
      <p>
        I'm so glad you're here. Whether you're joining the waitlist or taking the next step into one of my programs, I want you to know this experience was created to be personal, practical, and genuinely supportive.
      </p>
      {variant === 'registration' && courseName ? (
        <p>
          For {courseName}, you'll find details on what's included, kit/shipping where applicable, and secure checkout below.
        </p>
      ) : null}
      <p>
        If enrollment isn't open yet, joining the waitlist means you'll be among the first to hear when the next opportunity becomes available. If registration is open, I'll be here to support you through the next steps.
      </p>
      <p>Thank you for trusting me with part of your journey.</p>
      <p className="amanda-note-signature">
        Warmly,<br />
        <strong>Amanda Catherine</strong>
      </p>
    </section>
  );
}
