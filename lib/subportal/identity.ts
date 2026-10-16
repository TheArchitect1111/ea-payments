/** Clerk identity is the Supabase third-party JWT principal. Never use EA HMAC cookies as DB JWTs. */
import 'server-only';
import {auth,clerkClient} from '@clerk/nextjs/server';
import {subportalDb,type StudentRow} from './db';
import {findMembership} from '@/lib/memberships';
import type {Manifest} from './manifest';

export async function subportalViewer(manifest:Manifest){
  const session=await auth();
  if(!session.userId) return null;
  const client=await clerkClient();
  const user=await client.users.getUser(session.userId);
  const emailObject=user.emailAddresses.find(x=>x.id===user.primaryEmailAddressId);
  if(!emailObject || emailObject.verification?.status!=='verified')
    throw new Error('A verified primary email address is required');
  const email=emailObject.emailAddress.trim().toLowerCase();
  const token=await session.getToken();
  if(!token)throw new Error('Clerk session JWT unavailable');
  // The project's Supabase third-party Clerk integration must validate this JWT.
  // Identity claim is a server-only operation conditioned on Clerk-verified email.
  const identities=await subportalDb<StudentRow>('subportal_students',{
    query:{email:'eq.'+email,select:'id,email,name,auth_subject',limit:'1'},
  });
  const student=identities[0];
  if(student && student.auth_subject && student.auth_subject!==session.userId)
    throw new Error('Student identity already bound to another user');
  if(student && !student.auth_subject){
    const linked=await subportalDb<StudentRow>('subportal_students',{
      method:'PATCH',query:{id:'eq.'+student.id,auth_subject:'is.null'},
      payload:{auth_subject:session.userId},
    });
    if(!linked[0]){
      const fresh=await subportalDb<StudentRow>('subportal_students',{
        query:{id:'eq.'+student.id,select:'*',limit:'1'},
      });
      if(fresh[0]?.auth_subject!==session.userId)throw new Error('Student claim conflict');
    }
  }
  const membership=await findMembership(email,manifest.organizationId);
  const owner=membership?.status==='active' && (membership.role==='owner'||membership.role==='admin');
  if(owner){
    await subportalDb('subportal_owner_access',{
      method:'POST',query:{on_conflict:'organization_id,auth_subject'},
      prefer:'resolution=merge-duplicates,return=representation',
      payload:{organization_id:manifest.organizationId,auth_subject:session.userId,expires_at:new Date(Date.now()+2*60*1000).toISOString()},
    });
  }else{
    // A revoked owner cannot refresh a previous privileged binding.
    await subportalDb('subportal_owner_access',{
      method:'PATCH',query:{organization_id:'eq.'+manifest.organizationId,auth_subject:'eq.'+session.userId},
      payload:{expires_at:new Date(0).toISOString()},
    });
  }
  return {email,authSubject:session.userId,token,studentId:student?.id || null,owner:Boolean(owner)};
}
