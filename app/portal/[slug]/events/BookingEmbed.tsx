type Props = {
  bookingUrl: string;
  title?: string;
};

export default function BookingEmbed({ bookingUrl, title = 'Book time' }: Props) {
  const src = bookingUrl.trim();
  if (!src) return null;

  return (
    <div className="ep-module-card" style={{ marginBottom: 24 }}>
      <p className="ep-module-card-title">{title}</p>
      <div
        style={{
          position: 'relative',
          width: '100%',
          minHeight: 680,
          borderRadius: 12,
          overflow: 'hidden',
          border: '1px solid rgba(255,255,255,0.12)',
        }}
      >
        <iframe
          src={src}
          title={title}
          style={{ width: '100%', height: 680, border: 0 }}
          loading="lazy"
        />
      </div>
    </div>
  );
}
