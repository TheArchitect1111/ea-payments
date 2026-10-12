import {buildCigarPreview, type CigarAnswers} from './engine';
import {calculateCapacityImpact} from './impact';
import {ctpCalendlyUrl} from '@/lib/ctp-calendly';
import {cigarBookingUrl} from './booking-link';

const logoUrl = 'https://app.efficiencyarchitects.online/ea-logo.png';
const esc = (v:string):string => v.replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]??c));
const roleNames:Record<string,string>={
 brand:'Cigar Brand / Business',lounge:'Cigar Lounge / Retail',
 distributor:'Cigar Distributor / Wholesaler',other:'Cigar Industry Business',unsure:'Cigar Industry Business'
};
const usd=(n:number)=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD',maximumFractionDigits:0}).format(n);
export type ReportEmailInput={businessName:string;contactName:string;answers:CigarAnswers;submissionId?:string;hoursPerWeek?:number|null;laborCostPerHour?:number|null;reportFindings?:string[]};
export type CigarReportEmail={subject:string;html:string;text:string;role:string;findingsCount:number;bookingUrl:string};

export function buildCigarReportEmail(input:ReportEmailInput):CigarReportEmail{
 const assessment=buildCigarPreview(input.answers);
 const impact=calculateCapacityImpact({hoursPerWeek:input.hoursPerWeek,laborCostPerHour:input.laborCostPerHour});
 const business=input.businessName.trim().slice(0,110);
 const first=input.contactName.trim().split(/\s+/)[0].slice(0,70)||'there';
 const industry=roleNames[assessment.role]??roleNames.other;
 const bookingUrl=input.submissionId?cigarBookingUrl(input.submissionId):ctpCalendlyUrl();
 const findings=assessment.findings.slice(0,3);
 const documentNotes=(input.reportFindings??[]).filter(x=>typeof x==='string').slice(0,4).map(x=>x.slice(0,400));
 const findingsPlain=findings.length?findings.map((f,i)=>String(i+1)+'. '+f.title+': '+f.explanation).join('\n\n'):'We will clarify your priorities together during your call.';
 const timeText=impact.annualHours===null?
  'No time or dollar total can yet be verified. We will establish a baseline during your Capacity Review.':
  'You reported approximately '+impact.annualHours+' hours annually for one recurring activity.'+
  (impact.annualLaborCapacityValue===null?'':' At your optional hourly labor value, that is '+usd(impact.annualLaborCapacityValue)+' in occupied labor capacity, not verified cash savings.');
 const introduction='Thank you for completing the '+industry+' assessment for '+business+'. Here is your initial Capacity Impact Preview and a clear path toward a more detailed Operational Blueprint.';
 const steps='1. Review your initial findings.\n2. Schedule a 15-minute Strategy Meeting.\n3. Bring any reports you already have if convenient. No preparation is required.';
 const subject=business+' | Your EA Capacity Assessment and Next Steps';
 const text=[
  'Hello '+first+',',introduction,'YOUR ASSESSMENT SUMMARY',findingsPlain,
  'TIME, INVENTORY & FINANCIAL OPPORTUNITY',timeText,
  'A complete financial assessment requires verifying inventory, invoices, costs, deposits and any distributor report data. Figures are never invented or counted twice.',
  ...(documentNotes.length?['DOCUMENT OBSERVATIONS (UNVERIFIED)',...documentNotes]:[]),
  'RECOMMENDED NEXT STEPS',steps,'BOOK YOUR STRATEGY MEETING',bookingUrl,
  'You can also reply directly to this message.','Efficiency Architects'
 ].join('\n\n');
 const rows=findings.map(f=>'<tr><td style="padding:16px;border-bottom:1px solid #e6ded0"><strong style="color:#17211c">'+esc(f.title)+'</strong><br/><span style="font-size:13px;color:#526057;line-height:1.6">'+esc(f.explanation)+'</span></td></tr>').join('')||
 '<tr><td style="padding:16px">Your preliminary assessment will guide our conversation.</td></tr>';
 const notes=documentNotes.length?'<h2 style="font-size:15px;margin:28px 0 12px;color:#9c763a">DOCUMENT OBSERVATIONS (UNVERIFIED)</h2><ul style="font-size:13px">'+documentNotes.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':'';
 const html=[
 '<!doctype html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"></head>',
 '<body style="margin:0;padding:0;background:#f6f0e6;font-family:Arial,Helvetica,sans-serif;color:#17211c">',
 '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#f6f0e6"><tr><td align="center" style="padding:30px 12px">',
 '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:620px;background:#fffdf8;border:1px solid #e2dacd">',
 '<tr><td align="center" style="padding:34px 28px 18px">',
 '<img src="'+logoUrl+'" alt="Efficiency Architects" width="116" height="116" style="display:block;max-width:116px;margin:0 auto;border:0;object-fit:contain"/>',
 '<p style="color:#a68042;font-size:10px;font-weight:bold;letter-spacing:3px">EFFICIENCY ARCHITECTS</p>',
 '<h1 style="margin:14px 0 6px;font-family:Georgia,serif;font-size:28px;font-weight:normal">Your Business Capacity Assessment</h1>',
 '<p style="margin:0;color:#627064;font-size:13px">'+esc(industry)+'</p></td></tr>',
 '<tr><td style="padding:14px 34px 32px;font-size:15px;line-height:1.75">',
 '<p>Hello '+esc(first)+',</p><p>'+esc(introduction)+'</p>',
 '<h2 style="font-size:15px;margin:28px 0 12px;color:#9c763a">YOUR BUSINESS ASSESSMENT SUMMARY</h2>',
 '<table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:#faf7f0;border:1px solid #e6ded0">'+rows+'</table>',
 '<h2 style="font-size:15px;margin:28px 0 12px;color:#9c763a">TIME, RESOURCES &amp; FINANCIAL OPPORTUNITIES</h2>',
 '<p>'+esc(timeText)+'</p>',
 '<p style="font-size:13px;color:#627064">Inventory values, invoices, deposits, expenses and distributor reports must be verified before we can calculate genuine savings or profit.</p>',
 notes,
 '<h2 style="font-size:15px;margin:28px 0 12px;color:#9c763a">RECOMMENDED NEXT STEPS</h2>',
 '<ol style="padding-left:22px;font-size:14px"><li>Review your initial findings above.</li><li>Book a 15-minute Strategy Meeting.</li><li>Bring any existing records if convenient. No preparation required.</li></ol>',
 '</td></tr><tr><td align="center" style="background:#17211c;padding:34px 24px">',
 '<h2 style="font-family:Georgia,serif;font-size:22px;font-weight:normal;color:#fffdf8;margin:0 0 20px">Explore what is possible.</h2>',
 '<a href="'+esc(bookingUrl)+'" style="background:#b48a49;border-radius:6px;padding:15px 26px;color:#17211c;font-size:14px;font-weight:bold;text-decoration:none;display:inline-block">Book Your Strategy Meeting</a>',
 '<p style="font-size:12px;color:#e0d7c7;margin:20px 0 0">You may also reply directly to this email.</p></td></tr>',
 '<tr><td align="center" style="padding:20px;color:#6a7268;font-size:11px">Efficiency Architects · Clarity · Capacity · Confidence</td></tr>',
 '</table></td></tr></table></body></html>'
 ].join('');
 return {subject,html,text,role:assessment.role,findingsCount:findings.length,bookingUrl};
}
