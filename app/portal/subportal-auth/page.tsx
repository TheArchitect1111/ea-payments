import {ClerkProvider,SignIn} from '@clerk/nextjs';
import {safePortalReturnPath} from '@/lib/auth/portal-return-path';
export const dynamic='force-dynamic';
export default async function SubportalAuth({searchParams}:{
  searchParams:Promise<{next?:string}>;
}){
  const query=await searchParams;
  const afterSignIn=safePortalReturnPath(query.next)||'/portal/login';
  return <ClerkProvider>
    <main style={{minHeight:'100vh',display:'grid',placeItems:'center',background:'#f9f7f3',padding:24}}>
      <section>
        <h1>Secure student sign-in</h1>
        <p>Use the verified email address from your enrollment.</p>
        <SignIn routing="hash" forceRedirectUrl={afterSignIn}/>
      </section>
    </main>
  </ClerkProvider>;
}
