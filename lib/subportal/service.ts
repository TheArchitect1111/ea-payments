/** Paid-only idempotent provisioning, one identity across organizations. */
import 'server-only';
import {z} from 'zod';
import {randomUUID} from 'node:crypto';
import {subportalDb, type EnrollmentRow, type StudentRow} from './db';
import {loadSubportalManifest,requireSubportalOffer} from './manifest';
const Email=z.string().email().transform(s=>s.trim().toLowerCase());
const UUID=z.string().uuid();
const CreateSchema=z.object({
  organizationId:z.string().regex(/^rec[A-Za-z0-9]+$/),
  studentIdentity:UUID, offerId:z.string().min(1), paymentReference:z.string().min(5).max(220),
  idempotencyKey:z.string().min(8).max(250), provider:z.enum(['stripe','square']),
}).strict();

export async function resolveStudentIdentity(input:{email:string;name:string}):Promise<StudentRow>{
  const email=Email.parse(input.email);
  const name=z.string().trim().min(1).max(200).parse(input.name);
  // A stable, immutable UUID; email is only a verified claim/recovery alias.
  const rows=await subportalDb<StudentRow>('subportal_students',{
    method:'POST',query:{on_conflict:'email'},prefer:'resolution=ignore-duplicates,return=representation',
    payload:{id:randomUUID(),email,name},
  });
  const saved=rows[0] || (await subportalDb<StudentRow>('subportal_students',{
    query:{email:'eq.'+email,select:'*',limit:'1'},
  }))[0];
  if(!saved)throw new Error('Student identity could not be persisted');
  return saved;
}

export const subportalService={
  async create(raw:unknown){
    const input=CreateSchema.parse(raw);
    const manifest=await loadSubportalManifest(input.organizationId);
    const offer=requireSubportalOffer(manifest,input.offerId,input.provider);
    const student=await subportalDb<StudentRow>('subportal_students',{
      query:{id:'eq.'+input.studentIdentity,select:'id,email,name,auth_subject',limit:'1'},
    });
    if(student.length!==1)throw new Error('Unrecognized immutable student identity');

    // Both constraints stop duplicated portal/enrollment creation under racing webhook retries.
    const rows=await subportalDb<EnrollmentRow>('subportal_enrollments',{
      method:'POST', query:{on_conflict:'idempotency_key'},
      prefer:'resolution=ignore-duplicates,return=representation',
      payload:{
        organization_id:input.organizationId, student_id:input.studentIdentity,
        offer_id:offer.id, provider:input.provider, payment_reference:input.paymentReference,
        student_name:student[0].name, student_email:student[0].email,
        idempotency_key:input.idempotencyKey, program_title:offer.title,status:'active',
      },
    });
    const matches=rows.length?rows:await subportalDb<EnrollmentRow>('subportal_enrollments',{
      query:{idempotency_key:'eq.'+input.idempotencyKey,select:'*',limit:'1'},
    });
    const enrollment=matches[0];
    if(!enrollment || enrollment.organization_id!==input.organizationId ||
       enrollment.student_id!==input.studentIdentity || enrollment.offer_id!==offer.id ||
       enrollment.payment_reference!==input.paymentReference || enrollment.status!=='active')
      throw new Error('Idempotent enrollment collision or invalid state');
    // Idempotent progress row for each purchased enrollment; student portal is a shared route.
    await subportalDb('subportal_progress',{
      method:'POST',query:{on_conflict:'enrollment_id'},
      prefer:'resolution=ignore-duplicates,return=representation',
      payload:{enrollment_id:enrollment.id,student_id:student[0].id,organization_id:input.organizationId,
        completed_modules:[],current_module:null},
    });
    return {
      enrollmentId:enrollment.id,studentId:student[0].id,
      portalUrl:'/portal/'+encodeURIComponent(manifest.orgSlug)+'/students/'+encodeURIComponent(student[0].id),
      brand:manifest.brand,programTitle:offer.title,offer,
      student:student[0],
    };
  },
};
export async function requireVerifiedProviderCheckout(checkoutId:string,organizationId:string,offerId:string){
  const rows=await subportalDb<any>('subportal_checkout_orders',{
    query:{checkout_id:'eq.'+checkoutId,select:'*',limit:'1'},
  });
  const row=rows[0];
  if(!row || row.organization_id!==organizationId || row.offer_id!==offerId)
    throw new Error('Payment is not correlated to a trusted checkout');
  return row as {checkout_id:string;organization_id:string;offer_id:string;
    buyer_email:string;buyer_name:string;provider:string;amount_cad_cents:number};
}
export async function recordProviderCheckout(data:{
  checkoutId:string;organizationId:string;offerId:string;buyerEmail:string;buyerName:string;
  provider:'stripe'|'square';amountCadCents:number;
}){
  const rows=await subportalDb('subportal_checkout_orders',{
    method:'POST',query:{on_conflict:'checkout_id'},
    prefer:'resolution=ignore-duplicates,return=representation',
    payload:{checkout_id:data.checkoutId,organization_id:data.organizationId,offer_id:data.offerId,
      buyer_email:Email.parse(data.buyerEmail),buyer_name:data.buyerName,
      provider:data.provider,amount_cad_cents:data.amountCadCents},
  });
  if(!rows.length)throw new Error('Checkout correlation could not be saved');
  return rows[0];
}
