import { registry, formDefinition } from '@/lib/amanda-catherine/registry';
import { getAmandaHqTools } from '@/lib/amanda-catherine/hq-tools';
import AmandaForm from './AmandaForm';

export default async function FormPage({ kind, course = '', context = '' }: { kind: 'apply' | 'enroll' | 'foundry'; course?: string; context?: string }) {
  try {
    const [r, hqTools] = await Promise.all([registry(), kind === 'enroll' ? getAmandaHqTools() : Promise.resolve({})]);
    const selected = r.courses.find((c) => c.key === course);
    if (kind === 'enroll' && selected?.status === 'READY' && selected.square_checkout_url) return <section className="amanda-card amanda-form"><p className="amanda-status">AMANDA CATHERINE</p><h1>{selected.title}</h1>{hqTools.registerLetter && <p className="amanda-hq-letter">{hqTools.registerLetter}</p>}<p>{selected.description || 'Continue to secure Square checkout.'}</p>{selected.price !== null && <p>{'$' + selected.price.toLocaleString('en-US')}</p>}<a className="amanda-button" href={selected.square_checkout_url} target="_blank" rel="noopener noreferrer" data-cta-name="Enroll" data-course-key={selected.key}>Enroll securely with Square</a></section>;
    if (kind === 'enroll' && selected?.status === 'READY') return <section className="amanda-card"><p className="amanda-status">AMANDA CATHERINE</p><h1>{selected.title}</h1>{hqTools.registerLetter && <p className="amanda-hq-letter">{hqTools.registerLetter}</p>}<p>Square checkout is not configured for this course yet. Please contact Amanda for current enrollment options.</p></section>;

    const type = kind === 'enroll' ? 'waitlist' : 'application';
    const formId = type === 'application' ? 'amanda-apply' : `amanda-${type}`;
    const f = formDefinition(r.forms, formId);
    const waitlistCourses = r.courses.filter((c) => c.status !== 'READY' && !c.isTest);
    let fields = f.fields.map((field) => field.name === 'courseId' && type === 'waitlist' ? { ...field, type: 'select', options: waitlistCourses.map((c) => c.key), required: true } : field);
    if (type === 'waitlist' && !fields.some((field) => field.name === 'courseId')) fields = [...fields, { name: 'courseId', label: 'Course', type: 'select', required: true, options: waitlistCourses.map((c) => c.key) }];
    return <section className="amanda-card amanda-form"><p className="amanda-status">AMANDA CATHERINE</p><h1>{kind === 'foundry' ? 'Foundry Application' : type === 'waitlist' ? 'Join Amanda’s premium waitlist' : f.title}</h1><p>{selected?.title || (kind === 'enroll' ? 'Choose the course you are interested in and Amanda’s team will follow up.' : 'Tell us about your next step.')}</p>{type === 'waitlist' && <>{hqTools.waitlistLetter && <p className="amanda-hq-letter">{hqTools.waitlistLetter}</p>}<p>Join Amanda’s premium waitlist to receive enrollment news and next steps directly from her team.</p></>}<AmandaForm fields={fields} label={f.label} type={type} formId={formId} courseId={course} context={context || kind} courseOptions={waitlistCourses.map((c) => ({ id: c.key, title: c.title }))} />{kind === 'foundry' && <p>Includes 90 days of clinical integration support and business mentorship.</p>}</section>;
  } catch {
    return <section className="amanda-card"><h1>We’re unable to load this form</h1><p role="alert">Please refresh in a moment.</p><a href="/portal/amanda-catherine/book">Contact Amanda through booking</a></section>;
  }
}
