import Link from 'next/link';
import {listPortalFormSubmissions} from '@/lib/portal-forms/store';
import {amandaApplicationsForQueue} from '@/lib/amanda-catherine/queues';
import OwnerApplicationQueue from '../OwnerApplicationQueue';
export const dynamic='force-dynamic';
// The Amanda owner layout requires this exact tenant and a staff-or-higher role.
export default async function AmandaClientApplications(){
 const applications=await listPortalFormSubmissions('amanda-catherine',{kind:'application'});
 return <section><h1>Clients &amp; Foundry applications</h1><p>General client and Foundry applications awaiting Amanda’s follow-up.</p>
 <nav aria-label="Amanda application queues"><Link data-cta-name="Founder Advisory queue" data-cta-key="founder-advisory-queue" href="/portal/amanda-catherine/owner/advisory">Founder Advisory</Link>{' · '}<Link data-cta-name="Speaking queue" data-cta-key="speaking-queue" href="/portal/amanda-catherine/owner/speaking">Speaking &amp; Media</Link>{' · '}<Link data-cta-name="LIFELINE queue" data-cta-key="lifeline-queue" href="/portal/amanda-catherine/owner/lifeline">LIFELINE</Link></nav>
 <OwnerApplicationQueue submissions={amandaApplicationsForQueue(applications,'clients')}/>
 <p><Link data-cta-name="Open client intake" data-cta-key="open-client-intake" href="/portal/amanda-catherine/intake">Open client intake</Link></p></section>;
}
