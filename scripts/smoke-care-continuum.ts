import { composeDirectedWebsite } from '../lib/layout-composer';
import { CARE_CONTINUUM_SIGNATURE } from '../lib/layout-composer/grammars/care-continuum-editorial';

function run(name: string, org: Parameters<typeof composeDirectedWebsite>[0]['organization']) {
  const result = composeDirectedWebsite({
    organization: org,
    portalLoginHref: '/portal/login',
    sitePath: '/admin/ea-factory/quick-launch',
    returnHref: '/admin/ea-factory/quick-launch',
  });
  const blob = JSON.stringify(result.puckData);
  console.log(
    JSON.stringify({
      name,
      signature: result.composed.compositionSignature,
      isCare: result.composed.compositionSignature === CARE_CONTINUUM_SIGNATURE,
      types: result.puckData.content.map((c) => c.type),
      hasSubject: blob.includes(org.organizationName),
      hasKristina: /kristina/i.test(blob),
      hasOverlap: result.puckData.content.some((c) => c.type === 'EAOverlapScene'),
      hasPathway: result.puckData.content.some((c) => c.type === 'EAPathwayStrip'),
    }),
  );
}

run('Alex Rivera', {
  organizationName: 'Alex Rivera',
  subjectRole: 'Clinical Liaison',
  affiliatedOrganizationName: 'Harbor Home Health',
  industry: 'Home health and hospice care',
  whoTheyAre: 'Alex Rivera serves as a Clinical Liaison with Harbor Home Health.',
  brandHeadline: 'A trusted guide between hospital, home, and family',
  brandSubhead:
    'Alex Rivera is a Clinical Liaison at Harbor Home Health—helping families understand home health and hospice pathways.',
  carePathways: [
    { title: 'Home Health Care', body: 'Nursing, therapy, and aide support at home.' },
    { title: 'Home Hospice', body: 'Comfort-focused support for terminal illness at home.' },
    { title: 'Family Guidance', body: 'Clear conversations for referring partners and households.' },
  ],
  serviceGeography: 'Coastal Carolinas',
  contactPhone: '1-800-555-0199',
  organizationUrl: 'https://example.org/harbor',
  primaryColor: '#1B3A4B',
  accentColor: '#7BA3A8',
});

run('Jordan Ellis', {
  organizationName: 'Jordan Ellis',
  subjectRole: 'Hospice Care Coordinator',
  affiliatedOrganizationName: 'Maple Grove Hospice',
  industry: 'Hospice and palliative care',
  whoTheyAre: 'Jordan Ellis coordinates hospice care pathways for Maple Grove Hospice.',
  brandHeadline: 'Compassionate guidance when care needs change',
  brandSubhead:
    'Jordan Ellis helps families understand palliative and hospice options with Maple Grove Hospice.',
  carePathways: [
    { title: 'In-home hospice', body: 'Interdisciplinary support at home.' },
    { title: 'Palliative consult', body: 'Symptom-focused guidance earlier in illness.' },
    { title: 'Bereavement support', body: 'Family support that continues after loss.' },
  ],
  serviceGeography: 'Piedmont region',
  contactPhone: '1-888-555-0142',
  organizationUrl: 'https://example.org/maple',
  primaryColor: '#1B3A4B',
  accentColor: '#7BA3A8',
});
