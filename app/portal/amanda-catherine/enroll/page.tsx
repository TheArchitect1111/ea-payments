import FormPage from '../FormPage';
export default async function Page({searchParams}:{searchParams:Promise<{course?:string;form?:string}>}){const q=await searchParams;return <FormPage kind="enroll" course={q.course} context={q.form}/>;}
