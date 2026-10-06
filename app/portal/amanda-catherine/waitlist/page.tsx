import FormPage from '../(engagement)/FormPage';
export const dynamic='force-dynamic';
export const metadata={title:'Amanda’s Premium Waitlist',description:'Join Amanda Catherine’s course waitlist.'};
export default async function Page({searchParams}:{searchParams:Promise<{course?:string}>}){const q=await searchParams;return <main className="min-h-screen bg-[#f7f1e8] px-5 py-12 text-[#17130f]"><div className="mx-auto max-w-4xl"><FormPage kind="enroll" course={q.course||''} context="waitlist"/></div></main>;}