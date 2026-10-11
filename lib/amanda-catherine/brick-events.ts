import {registerBrickEvent,type BrickInteractionEvent} from '@/lib/services/brickRegistrar';
import {amandaClickScope,amandaCtaKey,type AmandaClick} from './tracking';
/** Clicks never manufacture contacts or payment evidence. */
export function registerAmandaClick(click:AmandaClick,isTest=false) {
  const key=amandaCtaKey(click.cta_key);
  const event:BrickInteractionEvent={event_type:'interaction',client_id:'amanda-catherine',
    event_id:click.event_id,visitor_id:click.visitor_id,event:`amanda:${amandaClickScope(click.page)}:${key}`,
    cta_key:key,cta_name:click.cta_name,source:click.page,destination:click.destination,
    timestamp:click.timestamp,is_test:isTest,...(click.course_key?{course_key:click.course_key}:{})};
  return registerBrickEvent(event);
}

export function registerAmandaSignup(input:{registrationId:string;brickId:string;name:string;email:string;phone?:string;source:string;isTest?:boolean}) {
 return registerBrickEvent({brick_type:'checkout',brick_id:input.brickId,client_id:'amanda-catherine',
  registration_id:input.registrationId,name:input.name,email:input.email,phone:input.phone||'',
  status:'checkout_started',payment_status:'unpaid',payment_reference:null,
  timestamp:new Date().toISOString(),source:input.source,is_test:input.isTest===true});
}
export function registerAmandaPaid(input:{registrationId:string;brickId:string;name:string;email:string;phone:string;reference:string;timestamp:string;isTest:boolean}) {
 return registerBrickEvent({brick_type:'payments',brick_id:input.brickId,client_id:'amanda-catherine',
  registration_id:input.registrationId,name:input.name,email:input.email,phone:input.phone,status:'payment_confirmed',
  payment_status:'paid',payment_reference:input.reference,timestamp:input.timestamp,source:'stripe/amanda',is_test:input.isTest},
  {event_type:'payment_confirmed',registration_id:input.registrationId,email:input.email,class_id:input.brickId,
   payment_status:'paid',payment_reference:input.reference,payment_provider:'stripe',timestamp:input.timestamp,
   client_id:'amanda-catherine',is_test:input.isTest});
}
