import type {CigarAnswers,Finding} from './engine';
import {ctpCalendlyUrl} from '@/lib/ctp-calendly';
export type OptionalImpactInputs={hoursPerWeek?:number|null;laborCostPerHour?:number|null};
export type CapacityImpact={
 status:'not-quantified'|'partial-time-estimate'|'labor-capacity-valued';
 annualHours:number|null;annualLaborCapacityValue:number|null;realizedCashSavings:null;
 assumptions:string[];note:string;
};
const valid=(v:unknown,max:number):number|null=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<=max?v:null;
export function calculateCapacityImpact(input:OptionalImpactInputs):CapacityImpact{
 const hours=valid(input.hoursPerWeek,168),rate=valid(input.laborCostPerHour,1000);
 const annualHours=hours===null?null:Math.round(hours*52*100)/100;
 const value=annualHours===null||rate===null?null:Math.round(annualHours*rate*100)/100;
 return {
  status:value!==null?'labor-capacity-valued':annualHours!==null?'partial-time-estimate':'not-quantified',
  annualHours,annualLaborCapacityValue:value,realizedCashSavings:null,
  assumptions:[...(hours===null?[]:['Owner-estimated hours per week multiplied by 52 weeks.']),...(value===null?[]:['Owner-estimated hourly labor value, not a cash-saving promise.'])],
  note:value===null?'Financial impact cannot yet be reliably quantified. We will verify the numbers during your Capacity Review.':'This represents labor capacity currently occupied by the described work. It is NOT verified savings, additional revenue or profit.',
 };
}
export function buildAssessmentEmailPreview(contact:{businessName:string;contactName:string},answers:CigarAnswers,findings:Finding[],impact:CapacityImpact):{subject:string;body:string}{
 const first=contact.contactName.trim().split(/\s+/)[0]||'there';
 const business=contact.businessName.trim()||'your business';
 const primary=findings.slice(0,3).map((f,i)=>String(i+1)+'. '+f.title+': '+f.explanation).join('\n');
 const known=impact.annualHours===null?'No time total is available yet.':
  'You estimated approximately '+impact.annualHours.toLocaleString('en-US')+' hours per year in this activity.';
 const value=impact.annualLaborCapacityValue===null?'':' Using your optional labor rate, the associated annual capacity value is approximately $'+impact.annualLaborCapacityValue.toLocaleString('en-US',{maximumFractionDigits:2})+'. This is NOT a verified cash saving.';
 const notes=Object.values(answers).filter(a=>a.detail.trim()).length;
 return {subject:'Your EA Cigar Business Capacity Preview',body:'Hello '+first+',\n\nThank you for sharing how '+business+' operates. Here are the initial opportunities we identified from your answers:\n\n'+(primary||'We will discuss your priorities and identify where clearer information could help.')+'\n\nCapacity and financial impact:\n'+known+value+'\n'+impact.note+'\n\nWe noted '+notes+' question(s) with additional context. We will review them during Discovery instead of guessing missing numbers.\n\nSchedule your Capacity Review with Efficiency Architects: '+ctpCalendlyUrl()+'\nOr reply to this email to continue the conversation.\n\nEfficiency Architects\n\nThis is an email preview. It has not been sent.'};
}
