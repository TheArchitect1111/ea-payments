/**
 * Vendor communication policy engine. Deliberately NO transport, provider credentials,
 * mailbox provisioning, or send function. Inbound vendor text is untrusted.
 */
export type VendorAction='acknowledge'|'request-report'|'reminder'|'invoice-question'|'place-order'|'approve-payment'|'change-terms';
export type VendorPolicy={
 approved:boolean;recipientVerified:boolean;approvedEmail:string;
 reportDueAt?:string;maxReminders:number;remindersSent:number;paused:boolean;
};
export type VendorDecision={status:'blocked'|'owner-review'|'eligible';reason:string;subject:string;body:string;sent:false};
export function evaluateVendorAction(action:VendorAction,businessName:string,recipient:string,policy:VendorPolicy,now=new Date()):VendorDecision{
 const result=(status:VendorDecision['status'],reason:string,subject='',body=''):VendorDecision=>({status,reason,subject,body,sent:false});
 const company=businessName.replace(/[\r\n<>]/g,' ').slice(0,100).trim()||'Our company';
 if(policy.paused||!policy.approved||!policy.recipientVerified||recipient.trim().toLowerCase()!==policy.approvedEmail.toLowerCase()||!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(recipient)){
  return result('blocked','Tenant authorization or verified recipient missing, or automation paused.');
 }
 if(['place-order','approve-payment','change-terms'].includes(action))return result('blocked','Orders, payments, pricing and agreements always require a human.');
 if(action==='invoice-question')return result('owner-review','Invoice questions or disputes must be reviewed by the owner.','Invoice review request','Please review the invoice details with the business owner.');
 if(action!=='acknowledge'){
  if(!policy.reportDueAt||!Number.isFinite(Date.parse(policy.reportDueAt))||Date.parse(policy.reportDueAt)>=now.getTime())return result('blocked','Scheduled report not overdue.');
  if(policy.remindersSent>=Math.min(Math.max(policy.maxReminders,0),2))return result('blocked','Maximum reminders already reached.');
 }
 const subject=action==='acknowledge'?'Report received':action==='request-report'?'Scheduled report requested':'Follow-up on scheduled report';
 const body=action==='acknowledge'?
  'Hello, '+company+' confirms receipt of your report. This is an automated acknowledgment. A team member will review the information. Reply to reach our team.':
  'Hello, '+company+' has not yet received the scheduled report. Please send it or let us know when it will be available. This is an automated administrative message. You can reply to reach our team.';
 return result('eligible','Template is eligible after provider authorization, rate limits, quiet hours and audit logging are verified. This preview NEVER sends.',subject,body);
}
