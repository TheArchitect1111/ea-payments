import Link from 'next/link';
import './guided-first-success.css';

export default function EmptyStateGuide({
  title,
  explanation,
  actionLabel,
  actionHref,
}: {
  title: string;
  explanation: string;
  actionLabel: string;
  actionHref: string;
}) {
  return (
    <div className="es-guide">
      <h3>{title}</h3>
      <p>{explanation}</p>
      <Link href={actionHref} className="es-btn">
        {actionLabel}
      </Link>
    </div>
  );
}
