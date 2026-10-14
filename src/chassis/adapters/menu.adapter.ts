import { sourceAdapter } from './sourceAdapter';
import { getCourseMenuRoute } from '../../../lib/amanda-catherine/menu-routing';
import { AMANDA_READY_COURSE_IDS } from '../../../lib/amanda-catherine/lms-policy';
export const menuAdapter=sourceAdapter({id:'menu',files:[{path:'lib/amanda-catherine/menu-routing.ts',contains:'getCourseMenuRoute'}],verify:async()=>{
 const id=AMANDA_READY_COURSE_IDS[0];
 const ready={id,status:'READY'};
 const purchased=getCourseMenuRoute(ready,{purchasedCourseIds:[id]});
 const unpurchased=getCourseMenuRoute(ready,{purchasedCourseIds:[]});
 const waiting=getCourseMenuRoute({id:'not-ready',status:'WAITLIST'},{purchasedCourseIds:[]});
 const passed=purchased.includes('/learning/')&&unpurchased.startsWith('/courses/')&&waiting.endsWith('#waitlist');
 return {status:passed?200:503,evidence:`READY purchased=${purchased}; READY sales=${unpurchased}; WAITLIST=${waiting}; owner-only dollar menu still requires separate auth proof`};
}});
