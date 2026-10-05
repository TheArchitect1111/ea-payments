import FormPage from '@/app/portal/amanda-catherine/FormPage';
import Layout from '@/app/portal/amanda-catherine/layout';
export default async function Page({params}:{params:Promise<{slug:string}>}){const {slug}=await params;return <Layout><div id="waitlist"><FormPage kind="enroll" course={slug}/></div></Layout>;}
