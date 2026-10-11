import { registry, formDefinition } from '@/lib/amanda-catherine/registry';
import { getAmandaHqTools } from '@/lib/amanda-catherine/hq-tools';
import AmandaForm from './AmandaForm';
import {amandaApplicationIdentity} from '@/lib/amanda-catherine/queues';

export default async function FormPage({ kind, course = '', context = '', program = '' }: { kind: 'apply' | 'enroll' | 'foundry'; course?: string; context?: string; program?: string }) {
  try {
    const [r, hqTools] = await Promise.all([registry(), getAmandaHqTools()]);
    const selected = r.courses.find((c) => c.key === course);
    if (kind === 'enroll' && selected && ['READY','LIVE'].includes(selected.status) && selected.price !== null) {
      const form=formDefinition(r.forms,'amanda-enroll');
      return <section className="amanda-card amanda-form"><p className="amanda-status">AMANDA CATHERINE</p><h1>{selected.title}</h1>
        {hqTools.registerLetter && <p className="amanda-hq-letter">{hqTools.registerLetter}</p>}
        <p>Register first, then continue to secure Square payment.</p>
        <AmandaForm fields={form.fields} label="Register and continue to Square" type="enroll" formId="amanda-enroll"
          courseId={selected.key} context="enroll" />
      </section>;
    }
    if (kind === 'enroll' && selected && ['READY','LIVE'].includes(selected.status)) return <section className="amanda-card"><p className="amanda-status">AMANDA CATHERINE</p><h1>{selected.title}</h1>{hqTools.registerLetter && <p className="amanda-hq-letter">{hqTools.registerLetter}</p>}<p>A checkout price has not been configured for this course. Please contact Amanda for current enrollment options.</p></section>;

    const type = kind === 'enroll' ? 'waitlist' : 'application';
    const formId = type === 'application' ? 'amanda-apply' : `amanda-${type}`;
    const identity=type==='application'?amandaApplicationIdentity(context||'amanda-apply',context,program):null;
    const submittedFormId=identity?.formId||formId;
    const f = formDefinition(r.forms, formId);
    const waitlistCourses = r.courses.filter((c) => !['READY','LIVE'].includes(c.status) && !c.isTest);
    let fields = f.fields.map((field) => field.name === 'courseId' && type === 'waitlist' ? { ...field, type: 'select', options: waitlistCourses.map((c) => c.key), required: true } : field);
    if (type === 'waitlist' && !fields.some((field) => field.name === 'courseId')) fields = [...fields, { name: 'courseId', label: 'Course', type: 'select', required: true, options: waitlistCourses.map((c) => c.key) }];
    return <section className="amanda-card amanda-form">{kind === 'enroll' && <><p className="amanda-status">AMANDA CATHERINE</p><h1>{type === 'waitlist' ? 'Join Amanda’s premium waitlist' : f.title}</h1></>}<p>{selected?.title || (kind === 'enroll' ? 'Choose the course you are interested in and Amanda’s team will follow up.' : 'Tell us about your next step.')}</p>{type === 'waitlist' && <>{hqTools.waitlistLetter && <p className="amanda-hq-letter">{hqTools.waitlistLetter}</p>}<p>Join Amanda’s premium waitlist to receive enrollment news and next steps directly from her team.</p></>}<AmandaForm fields={fields} label={f.label} type={type} formId={submittedFormId} program={identity?.program||program} courseId={course} context={context || kind} courseOptions={waitlistCourses.map((c) => ({ id: c.key, title: c.title }))} />{kind === 'foundry' && <p>Includes 90 days of clinical integration support and business mentorship.</p>}</section>;
  } catch {
    return <section className="amanda-card"><h1>We’re unable to load this form</h1><p role="alert">Please refresh in a moment.</p><a data-cta-name="Contact Amanda through booking" data-cta-key="contact-amanda-through-booking" href="/portal/amanda-catherine/book">Contact Amanda through booking</a></section>;
  }
}
