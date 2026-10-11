import FormPage from '../FormPage';
export default async function Page({searchParams}:{searchParams:Promise<{course?:string;form?:string;program?:string}>}){const q=await searchParams;return <FormPage kind="apply" course={q.course} context={q.form} program={q.program}/>;}
