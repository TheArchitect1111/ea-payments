import {NextRequest,NextResponse} from 'next/server';
import {guardPortalApi,portalApiUnauthorized} from '@/lib/api/portal-route';
import {buildEvaRecommendations,type AmplifiMemory} from '@/lib/amplifi-intelligence';
export const dynamic='force-dynamic';
export async function POST(req:NextRequest){const auth=await guardPortalApi(req,{realm:'simplifi'});if(!auth.ok)return portalApiUnauthorized(auth);const body=await req.json().catch(()=>({}));const goal=String(body.goal||'').trim(),audience=String(body.audience||'').trim(),details=String(body.details||'').trim(),memory=(body.memory||undefined) as AmplifiMemory|undefined,performance=body.performance||undefined;if(!goal||!audience)return NextResponse.json({ok:false,error:'Goal and audience are required.'},{status:400});return NextResponse.json({ok:true,guide:'Eva',...buildEvaRecommendations({goal,audience,details,memory,performance})});}
