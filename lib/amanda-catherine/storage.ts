import { createRecord } from './airtable';

// Maps to your 4 required tables
export async function handleAmandaSubmit(payload: any){
  const results: any = {};
  const now = new Date().toISOString();
  const common = {
    'Name': payload.name || payload.fullName || '',
    'Full Name': payload.name || payload.fullName || '',
    'Email': payload.email || '',
    'Phone': payload.phone || '',
    'Source': 'amanda-catherine',
    'Created': now,
  };

  if(payload.type === 'waitlist'){
    // amanda_waitlist
    results.waitlist = await createRecord('amanda_waitlist', {
      ...common,
      'Course': payload.courseId || payload.course || '',
      'Course interested in': payload.courseId || payload.course || '',
      'Message': payload.message || '',
      'Status': 'Waitlisted',
    });
  }

  if(payload.type === 'enroll'){
    // 1. Creative Studio
    results.creativeStudio = await createRecord('Creative Studio', {
      ...common,
      'Course ID': payload.courseId,
      'Course': payload.courseId,
      'Program': payload.courseId,
      'Type': 'Enrollment',
      'Amount CAD': payload.amount || '',
      'Status': 'Enrolled',
      'Notes': `Enrolled via /portal/amanda-catherine/enroll?course=${payload.courseId}`,
    }).catch(e=>({error:e.message, table:'Creative Studio'}));

    // 2. Client Records
    results.clientRecord = await createRecord('Client Records', {
      ...common,
      'Course ID': payload.courseId,
      'Course': payload.courseId,
      'Program': payload.courseId,
      'Type': 'Client - Amanda Catherine',
      'Status': 'Active - Enrolled',
      'Enrollment Date': now,
    }).catch(e=>({error:e.message, table:'Client Records'}));

    // 3. Portal Form Submissions (audit trail for portal)
    results.portalSubmission = await createRecord('Portal Form Submissions', {
      ...common,
      'Form Type': 'Enrollment',
      'Form ID': payload.courseId,
      'Course': payload.courseId,
      'Payload': JSON.stringify(payload),
      'Status': 'Submitted',
    }).catch(e=>({error:e.message, table:'Portal Form Submissions'}));
  }

  if(payload.type === 'application'){
    results.application = await createRecord('Portal Form Submissions', {
      ...common,
      'Form Type': 'Application',
      'Form ID': payload.formId || payload.form || '',
      'Organization': payload.organization || '',
      'Message': payload.message || payload.bio || '',
      'Website': payload.website || '',
      'Status': 'Application Received',
      'Payload': JSON.stringify(payload),
    });
  }

  if(payload.type === 'kit'){
    results.kitStudio = await createRecord('Creative Studio', {
      ...common,
      'Course ID': 'practitioner-kit',
      'Type': 'Kit Purchase',
      'Amount CAD': 499,
      'Status': 'Kit Purchased',
    }).catch(e=>({error:e.message}));

    results.kitClient = await createRecord('Client Records', {
      ...common,
      'Course ID': 'practitioner-kit',
      'Type': 'Client - Kit',
      'Status': 'Kit Active',
    }).catch(e=>({error:e.message}));
  }

  return results;
}
