import FormPage from '../FormPage';
export const dynamic='force-dynamic';
export const metadata={title:'Amanda’s Premium Waitlist',description:'Join Amanda Catherine’s course waitlist.'};
export default async function Page({searchParams}:{searchParams:Promise<{course?:string}>}){const q=await searchParams;return <FormPage kind="enroll" course={q.course||''} context="waitlist"/>;}