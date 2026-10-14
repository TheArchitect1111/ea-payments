import { sourceAdapter } from './sourceAdapter';
import { AMANDA_READY_COURSE_IDS, amandaCourseReady } from '../../../lib/amanda-catherine/lms-policy';
export const lmsAdapter=sourceAdapter({id:'lms',files:[{path:'lib/amanda-catherine/lms-policy.ts',contains:'AMANDA_READY_COURSE_IDS'}],verify:async()=>{
 const ids=AMANDA_READY_COURSE_IDS;
 const valid=ids.length===5&&new Set(ids).size===5&&ids.every(id=>typeof id==='string'&&id.length>0&&amandaCourseReady(id));
 return {status:valid?200:503,evidence:`READY mapping ${ids.length}/5 unique valid: ${ids.join(', ')}`};
}});
