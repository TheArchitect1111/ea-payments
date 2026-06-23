import Link from 'next/link';
import { SKIN_FACTORY_FUTURE_HOOKS } from '@/lib/skin-factory';
import { SKIN_GOLD, SKIN_NAVY } from './SkinFactoryLayout';

export default function FutureHooksPanel() {
  return (
    <section className="border border-dashed border-neutral-300 bg-white p-5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-[0.24em]" style={{ color: SKIN_GOLD }}>
        Future Hooks
      </p>
      <h2 className="mt-2 text-lg font-black" style={{ color: SKIN_NAVY }}>
        Connected Factory phases
      </h2>
      <p className="mt-2 text-sm leading-6 text-neutral-600">
        Placeholder links to upcoming automation. Skin Factory feeds approved packages into these phases — it does not
        deploy on its own.
      </p>
      <ul className="mt-4 space-y-2">
        {SKIN_FACTORY_FUTURE_HOOKS.map((hook) => (
          <li key={hook.id}>
            <Link
              href={hook.href}
              className="flex items-center justify-between border border-neutral-200 px-3 py-2 text-sm hover:border-[#C9A844]"
            >
              <span className="font-semibold text-neutral-800">{hook.label}</span>
              <span className="text-[10px] font-black uppercase tracking-wider text-neutral-400">
                {hook.ready ? 'Available' : 'Placeholder'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
